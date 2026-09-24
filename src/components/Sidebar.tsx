import { useState, type FormEvent } from 'react'
import type { Chat } from '../types'
import { Avatar } from './Avatar'

interface Props {
  chats: Chat[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: (recipient: string) => Promise<string | null>
  onLogout: () => void
}

export function Sidebar({ chats, activeId, onSelect, onCreate, onLogout }: Props) {
  const [recipient, setRecipient] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const value = recipient.trim()
    if (!value) return
    if (!value.startsWith('@') && value.replace(/\D/g, '').length < 10) {
      return setError('Номер в международном формате, например 79001234567')
    }
    setLoading(true)
    setError('')
    const err = await onCreate(value)
    setLoading(false)
    if (err) setError(err)
    else setRecipient('')
  }

  return (
    <aside className="sidebar">
      <header className="sidebar-head">
        <form className="new-chat" onSubmit={submit}>
          <input
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            placeholder="Номер телефона или @username"
            aria-label="Номер получателя"
          />
          <button type="submit" disabled={loading} title="Создать чат" aria-label="Создать чат">
            {loading ? '…' : (
              <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>
            )}
          </button>
        </form>
        {error && <p className="error small" role="alert">{error}</p>}
      </header>

      <ul className="chat-list">
        {chats.length === 0 && <li className="empty-list">Введите номер получателя, чтобы начать чат</li>}
        {chats.map(chat => {
          const last = chat.messages[chat.messages.length - 1]
          return (
            <li key={chat.chatId}>
              <button
                className={`chat-item${chat.chatId === activeId ? ' active' : ''}`}
                onClick={() => onSelect(chat.chatId)}
              >
                <Avatar name={chat.title} />
                <div className="chat-item-body">
                  <div className="chat-item-row">
                    <span className="chat-item-title">{chat.title}</span>
                    {last && <time>{formatTime(last.timestamp)}</time>}
                  </div>
                  <div className="chat-item-row">
                    <span className="chat-item-preview">
                      {last ? `${last.outgoing ? 'Вы: ' : ''}${last.text}` : 'Нет сообщений'}
                    </span>
                    {chat.unread > 0 && <span className="badge">{chat.unread}</span>}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      <footer className="sidebar-foot">
        <button className="link-btn" onClick={onLogout}>Выйти</button>
      </footer>
    </aside>
  )
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}
