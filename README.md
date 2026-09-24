# GREEN-API Telegram Chat

Веб-чат для отправки и получения текстовых сообщений в Telegram через [GREEN-API](https://green-api.com/telegram). Тестовое задание на должность фронтенд-разработчика React.

Демо: https://green-api-telegram-chat-iota.vercel.app

Чтобы открыть чат, нужны свои реквизиты инстанса GREEN-API. Они вводятся на первом экране и хранятся в `sessionStorage` вкладки.

## Запуск

Нужен Node.js 18+.

```bash
git clone https://github.com/GetMoneyStudio/green-api-telegram-chat.git
cd green-api-telegram-chat
npm install
npm run dev
```

Vite выведет адрес, обычно http://localhost:5173

Сборка:

```bash
npm run build
npm run preview
```

## Настройка GREEN-API

1. Создать инстанс Telegram в [console.green-api.com](https://console.green-api.com).
2. Авторизовать инстанс своим аккаунтом Telegram.
3. В настройках инстанса оставить URL для webhook пустым, иначе уведомления уйдут на webhook и HTTP API их не отдаст. Получение входящих сообщений включить.
4. Скопировать `apiUrl`, `idInstance`, `apiTokenInstance` в форму входа.

## Структура

```
src/
├── api/greenApi.ts        запросы к GREEN-API
├── components/
│   ├── Login.tsx          форма входа
│   ├── Sidebar.tsx        список чатов и создание чата
│   ├── ChatWindow.tsx     переписка и поле ввода
│   └── Avatar.tsx
├── App.tsx                состояние, цикл получения уведомлений
├── types.ts
└── styles.css
```

Входящие приходят через `ReceiveNotification` (long polling), каждое уведомление снимается с очереди через `DeleteNotification`. Сообщения дедуплицируются по `idMessage`.

## Ограничения

- только текстовые сообщения;
- история сообщений хранится в памяти и сбрасывается при перезагрузке страницы;
- React 18, TypeScript, Vite, без сторонних UI-библиотек.
