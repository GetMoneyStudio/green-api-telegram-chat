import type { Credentials } from '../types'

export class GreenApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const ERROR_MESSAGES: Record<number, string> = {
  401: 'Неверный idInstance или apiTokenInstance',
  403: 'Доступ запрещён, проверьте данные инстанса',
  429: 'Слишком много запросов, подождите',
  466: 'Исчерпан лимит тарифа Developer',
}

function url(c: Credentials, method: string, suffix = '') {
  const base = c.apiUrl.replace(/\/+$/, '')
  return `${base}/waInstance${c.idInstance}/${method}/${c.apiTokenInstance}${suffix}`
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  if (!res.ok) {
    throw new GreenApiError(ERROR_MESSAGES[res.status] ?? `Ошибка GREEN-API (${res.status})`, res.status)
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

export function getStateInstance(c: Credentials) {
  return request<{ stateInstance: string }>(url(c, 'getStateInstance'))
}

export interface CheckAccountResponse {
  exist?: boolean
  chatId?: string
  username?: string
  reason?: string
}

export function checkAccount(c: Credentials, recipient: string) {
  const body = recipient.startsWith('@')
    ? { username: recipient }
    : { phoneNumber: Number(recipient.replace(/\D/g, '')) }
  return request<CheckAccountResponse>(url(c, 'checkAccount'), {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function sendMessage(c: Credentials, chatId: string, message: string) {
  return request<{ idMessage: string }>(url(c, 'sendMessage'), {
    method: 'POST',
    body: JSON.stringify({ chatId, message }),
  })
}

export interface Notification {
  receiptId: number
  body: {
    typeWebhook: string
    idMessage?: string
    timestamp?: number
    senderData?: { chatId: string; senderName?: string; chatName?: string }
    messageData?: {
      typeMessage: string
      textMessageData?: { textMessage: string }
      extendedTextMessageData?: { text: string }
    }
  }
}

export function receiveNotification(c: Credentials, signal?: AbortSignal) {
  return request<Notification | null>(url(c, 'receiveNotification', '?receiveTimeout=20'), { signal })
}

export function deleteNotification(c: Credentials, receiptId: number) {
  return request<{ result: boolean }>(url(c, 'deleteNotification', `/${receiptId}`), {
    method: 'DELETE',
  })
}

export function extractText(body: Notification['body']): string | null {
  const data = body.messageData
  if (!data) return null
  if (data.typeMessage === 'textMessage') return data.textMessageData?.textMessage ?? null
  if (data.typeMessage === 'extendedTextMessage') return data.extendedTextMessageData?.text ?? null
  return null
}
