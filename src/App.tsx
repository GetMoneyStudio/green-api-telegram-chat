import { useCallback, useEffect, useRef, useState } from 'react'
import {
  checkAccount,
  deleteNotification,
  extractText,
  GreenApiError,
  receiveNotification,
  sendMessage,
  type Notification,
} from './api/greenApi'
import { ChatWindow } from './components/ChatWindow'
import { Login } from './components/Login'
import { Sidebar } from './components/Sidebar'
import type { Chat, Credentials, Message } from './types'

const STORAGE_KEY = 'green-api-credentials'
const MAX_RETRY_DELAY = 30000

function loadCredentials(): Credentials | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Credentials) : null
  } catch {
    return null
  }
}

export default function App() {
  const [creds, setCreds] = useState<Credentials | null>(loadCredentials)
  const [chats, setChats] = useState<Chat[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const seenIds = useRef(new Set<string>())
  const activeRef = useRef(activeId)
  activeRef.current = activeId

  const login = (c: Credentials) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(c))
    setCreds(c)
  }

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setCreds(null)
    setChats([])
    setActiveId(null)
    seenIds.current.clear()
  }, [])

  const pushMessage = useCallback((chatId: string, title: string, msg: Message) => {
    if (seenIds.current.has(msg.id)) return
    seenIds.current.add(msg.id)
    setChats(prev => {
      const isActive = activeRef.current === chatId
      const existing = prev.find(c => c.chatId === chatId)
      if (!existing) {
        return [{ chatId, title, messages: [msg], unread: msg.outgoing || isActive ? 0 : 1 }, ...prev]
      }
      const updated: Chat = {
        ...existing,
        messages: [...existing.messages, msg],
        unread: msg.outgoing || isActive ? existing.unread : existing.unread + 1,
      }
      return [updated, ...prev.filter(c => c.chatId !== chatId)]
    })
  }, [])

  const handleNotification = useCallback(
    (body: Notification['body']) => {
      const text = extractText(body)
      const chatId = body.senderData?.chatId
      if (!text || !chatId || !body.idMessage) return

      const title = body.senderData?.chatName || body.senderData?.senderName || chatId
      const timestamp = (body.timestamp ?? Date.now() / 1000) * 1000

      if (body.typeWebhook === 'incomingMessageReceived') {
        pushMessage(chatId, title, { id: body.idMessage, text, outgoing: false, timestamp })
      } else if (body.typeWebhook === 'outgoingMessageReceived') {
        pushMessage(chatId, title, { id: body.idMessage, text, outgoing: true, timestamp, status: 'sent' })
      }
    },
    [pushMessage],
  )

  useEffect(() => {
    if (!creds) return
    const controller = new AbortController()
    let stopped = false

    async function loop() {
      let delay = 1000
      while (!stopped) {
        try {
          const notification = await receiveNotification(creds!, controller.signal)
          delay = 1000
          if (!notification) continue
          try {
            handleNotification(notification.body)
          } finally {
            // снимаем с очереди любое уведомление, иначе оно придёт снова
            await deleteNotification(creds!, notification.receiptId)
          }
        } catch (err) {
          if (stopped || controller.signal.aborted) return
          if (err instanceof GreenApiError && err.status === 401) return logout()
          await new Promise(r => setTimeout(r, delay))
          delay = Math.min(delay * 2, MAX_RETRY_DELAY)
        }
      }
    }

    loop()

    return () => {
      stopped = true
      controller.abort()
    }
  }, [creds, handleNotification, logout])

  async function createChat(recipient: string): Promise<string | null> {
    if (!creds) return 'Нет подключения'
    try {
      const res = await checkAccount(creds, recipient)
      if (res.reason) return res.reason
      if (!res.exist || !res.chatId) return 'У этого номера нет Telegram или он скрыт настройками приватности'
      const chatId = res.chatId
      setChats(prev =>
        prev.some(c => c.chatId === chatId)
          ? prev
          : [{ chatId, title: res.username || recipient, messages: [], unread: 0 }, ...prev],
      )
      setActiveId(chatId)
      return null
    } catch (err) {
      if (err instanceof GreenApiError && err.status === 401) {
        logout()
        return null
      }
      return err instanceof Error ? err.message : 'Не удалось создать чат'
    }
  }

  async function send(text: string) {
    if (!creds || !activeId) return
    const chatId = activeId
    const tempId = `local-${Date.now()}`
    const patchMessage = (patch: Partial<Message>) =>
      setChats(prev =>
        prev.map(c =>
          c.chatId === chatId
            ? { ...c, messages: c.messages.map(m => (m.id === tempId ? { ...m, ...patch } : m)) }
            : c,
        ),
      )

    pushMessage(chatId, chatId, { id: tempId, text, outgoing: true, timestamp: Date.now(), status: 'sending' })
    try {
      const { idMessage } = await sendMessage(creds, chatId, text)
      // запоминаем id, чтобы не принять своё же сообщение вторым из уведомлений
      seenIds.current.add(idMessage)
      patchMessage({ id: idMessage, status: 'sent' })
    } catch (err) {
      if (err instanceof GreenApiError && err.status === 401) return logout()
      patchMessage({ status: 'error' })
    }
  }

  function select(id: string) {
    setActiveId(id)
    setChats(prev => prev.map(c => (c.chatId === id ? { ...c, unread: 0 } : c)))
  }

  if (!creds) return <Login onLogin={login} />

  const activeChat = chats.find(c => c.chatId === activeId) ?? null

  return (
    <div className={`app${activeChat ? ' has-active' : ''}`}>
      <Sidebar chats={chats} activeId={activeId} onSelect={select} onCreate={createChat} onLogout={logout} />
      <ChatWindow chat={activeChat} onSend={send} onBack={() => setActiveId(null)} />
    </div>
  )
}
