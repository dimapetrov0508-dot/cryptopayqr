# Telegram Crypto Pay Mini App

Безопасный стартовый каркас Telegram-бота и Mini App. Сейчас это демо: реальные блокчейн-переводы отключены.

## Запуск

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Для Telegram нужен HTTPS URL и `TELEGRAM_BOT_TOKEN`. Сервер проверяет подпись Telegram Mini App, применяет rate limit, CSP-заголовки через Helmet и проверяет владельца заказа на каждом запросе.

## Постоянный запуск

В репозитории есть `Dockerfile` и `render.yaml` для Render. После публикации сервиса задайте в переменных окружения `TELEGRAM_BOT_TOKEN` и `PUBLIC_URL` равным HTTPS-адресу Render.
