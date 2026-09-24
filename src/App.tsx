import { useState } from 'react'
import { Login } from './components/Login'
import type { Credentials } from './types'

const STORAGE_KEY = 'green-api-credentials'

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

  const login = (c: Credentials) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(c))
    setCreds(c)
  }

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setCreds(null)
  }

  if (!creds) return <Login onLogin={login} />

  return (
    <div className="app">
      <p>Инстанс {creds.idInstance} подключён</p>
      <button className="link-btn" onClick={logout}>Выйти</button>
    </div>
  )
}
