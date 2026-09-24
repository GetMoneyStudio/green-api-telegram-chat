import { useState, type FormEvent } from 'react'
import { getStateInstance } from '../api/greenApi'
import type { Credentials } from '../types'

interface Props {
  onLogin: (c: Credentials) => void
}

export function Login({ onLogin }: Props) {
  const [apiUrl, setApiUrl] = useState('https://api.green-api.com')
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const creds = { apiUrl: apiUrl.trim(), idInstance: idInstance.trim(), apiTokenInstance: apiTokenInstance.trim() }
    if (!/^\d+$/.test(creds.idInstance)) return setError('idInstance состоит только из цифр')
    if (!creds.apiTokenInstance) return setError('Укажите apiTokenInstance')
    setLoading(true)
    try {
      const { stateInstance } = await getStateInstance(creds)
      if (stateInstance !== 'authorized') {
        setError(`Инстанс не авторизован (статус: ${stateInstance}). Авторизуйте его в консоли GREEN-API.`)
      } else {
        onLogin(creds)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось подключиться')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo" aria-hidden>
          <svg viewBox="0 0 24 24" width="44" height="44"><path fill="currentColor" d="M9.8 15.3 9.6 19c.4 0 .6-.2.8-.4l2-1.9 4.1 3c.8.4 1.3.2 1.5-.7l2.7-12.7c.3-1.1-.4-1.6-1.2-1.3L3.6 11.3c-1.1.4-1.1 1.1-.2 1.4l4.1 1.3 9.6-6c.5-.3.9-.1.5.2z"/></svg>
        </div>
        <h1>Вход в чат</h1>
        <p className="login-hint">Данные инстанса есть в личном кабинете GREEN-API</p>

        <label>
          <span>apiUrl</span>
          <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://api.green-api.com" />
        </label>
        <label>
          <span>idInstance</span>
          <input value={idInstance} onChange={e => setIdInstance(e.target.value)} inputMode="numeric" placeholder="1101000001" autoFocus />
        </label>
        <label>
          <span>apiTokenInstance</span>
          <input value={apiTokenInstance} onChange={e => setToken(e.target.value)} type="password" placeholder="d75b3a66374942c5b3c019c698abc2067e151558acbd412345" />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button type="submit" disabled={loading}>{loading ? 'Подключение…' : 'Войти'}</button>
      </form>
    </div>
  )
}
