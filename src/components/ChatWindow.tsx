import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Chat } from '../types'
import { Avatar } from './Avatar'
import { formatTime } from './Sidebar'

interface Props {
  chat: Chat | null
  onSend: (text: string) => void
  onBack: () => void
}

export function ChatWindow({ chat, onSend, onBack }: Props) {
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat?.messages.length, chat?.chatId])

  if (!chat) {
    return (
      <main className="chat chat-empty">
        <span className="pill">Выберите чат или создайте новый</span>
      </main>
    )
  }

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const value = text.trim()
    if (!value) return
    onSend(value)
    setText('')
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <main className="chat">
      <header className="chat-head">
        <button className="back" onClick={onBack} aria-label="Назад к списку">
          <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg>
        </button>
        <Avatar name={chat.title} />
        <div>
          <div className="chat-head-title">{chat.title}</div>
          <div className="chat-head-sub">Telegram</div>
        </div>
      </header>

      <div className="messages">
        {chat.messages.length === 0 && <span className="pill">Сообщений пока нет</span>}
        {chat.messages.map(m => (
          <div key={m.id} className={`bubble ${m.outgoing ? 'out' : 'in'}${m.status === 'error' ? ' failed' : ''}`}>
            <span className="bubble-text">{m.text}</span>
            <span className="bubble-meta">
              {formatTime(m.timestamp)}
              {m.outgoing && (m.status === 'sending' ? ' 🕓' : m.status === 'error' ? ' ⚠' : ' ✓')}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form className="composer" onSubmit={submit}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Сообщение"
          rows={1}
          maxLength={4096}
          aria-label="Текст сообщения"
        />
        <button type="submit" disabled={!text.trim()} aria-label="Отправить">
          <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg>
        </button>
      </form>
    </main>
  )
}
