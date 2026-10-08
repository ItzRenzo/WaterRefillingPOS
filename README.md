# Water Refilling POS System

## Project Description

A point-of-sale system for managing water-refilling inventory through web, API, and mobile applications.

## Group Members

- Walton Alfante
- Clark Balbuena
- Ed Lorenz Bersamin
- Zenrick Denver Mintal

## Course

**CCE 106L – Applications Development and Emerging Technologies**

This workspace contains three independent applications:

- `frontend` - React 19 + TypeScript + Vite web application
- `backend` - Laravel 13 JSON API with Sanctum and SQLite
- `mobile` - React Native 0.86 + TypeScript using Expo SDK 57

## Requirements

- PHP 8.3 or newer and Composer
- Node.js 24 or a compatible LTS release and npm
- Expo Go or an Android/iOS simulator for mobile development

## First-time setup

The dependencies and the backend SQLite database are already initialized. After a fresh clone, run:

```powershell
cd backend
composer run setup

cd ..\frontend
npm install
Copy-Item .env.example .env.local

cd ..\mobile
npm install
Copy-Item .env.example .env.local
```

## Run locally

Open a separate terminal for each application.

Backend API:

```powershell
cd backend
php artisan serve
```

Web frontend:

```powershell
cd frontend
npm run dev
```

Mobile app:

```powershell
cd mobile
npm start
```

The API health endpoints are `http://localhost:8000/up` and
`http://localhost:8000/api/health`.

The Products REST API is available at `http://localhost:8000/api/products`.
See [SUBMISSION.md](SUBMISSION.md) for its endpoint list, test evidence, and screenshots.

For a physical phone, replace `localhost` in `mobile/.env.local` with the
computer's LAN IP address and run Laravel on the network:

```powershell
php artisan serve --host=0.0.0.0
```

## Gemini AI assistant (web and mobile)

After signing in, use **Ask AI** on the website or **Ask RJane Assistant** at the bottom of the mobile app.
The website chat also adapts to phone screens. Both clients use the same authenticated Laravel endpoint,
`POST /api/chat`. The assistant can explain POS tasks and answer questions about current stock, prices,
and today's sales; it cannot modify inventory or process sales.

1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/api-keys).
2. Add these values to `backend/.env`:

   ```dotenv
   GEMINI_API_KEY=your_actual_key_here
   GEMINI_MODEL=gemini-3.5-flash-lite
   GEMINI_REQUESTS_PER_MINUTE=10
   ```

3. In `backend`, run `php artisan config:clear`, then start/restart the API as usual.
4. Start the web/mobile app using the existing API base configuration. No Gemini key belongs in
   `VITE_*`, `EXPO_PUBLIC_*`, browser storage, or the mobile bundle.

The default model has a [Gemini free tier](https://ai.google.dev/gemini-api/docs/pricing).
Model access and quotas depend on your Google project; change `GEMINI_MODEL` to an available
text model in your AI Studio account if needed. The app makes no automatic retries or paid-model fallbacks.
It limits each user to five requests per minute and shares the configured project limit across all users;
adjust that limit to your account's actual quota. Daily/token quota exhaustion displays an error with a retry option.

Each question sends the message, up to six previous conversation turns, the signed-in role, a snapshot
of up to 100 products (prioritizing products needing stock), and today's aggregate sales totals to Google.
No passwords, tokens, user names, or individual sale records are included in the snapshot.
Google's free-tier data use is described on its pricing page. Chats remain in memory and clear when you
start a new chat, reload, or sign out; closing/reopening the panel preserves the current conversation.

The feature tests mock Gemini so tests never use your key or consume provider quota. A real Gemini
response requires your configured API key and internet access.

## Purified-water POS workflow

The web cashier terminal sells purified water in two containers: a standard blue gallon
and a 500 mL plastic bottle. Select a container and quantity, continue to cash payment,
enter the cash received, and complete the sale. The receipt includes the total, cash,
change, cashier, and receipt number. Print receipt opens the browser print dialog;
receipts can also be reprinted from recent transactions.

The administrator dashboard shows both available stock quantities, today's cash revenue,
recent transactions, and stock additions. Add stock increases inventory immediately.
Open cashier terminals check for new stock every five seconds and prompt staff to Refresh.

The local database is `backend/database/seeded.sqlite`, configured through the ignored
`backend/.env`. Run `php artisan migrate --seed` to apply the schema and sample data.
Seeders provide the two active products, 50 historical sample cash sales, and opening
inventory records. Old sample products are retired, preserving any historical references.
Rerunning seeds preserves stock quantities and does not duplicate the sample sales.

| Role | Username | Password |
| --- | --- | --- |
| Admin | admin | admin123 |
| Cashier (Walton) | walton | cashier123 |

`POST /api/sales` requires `product_id`, `quantity`, `cash_received`,
`payment_method: "cash"`, and a UUID `checkout_key`. Reuse that key when retrying the same
payment to avoid a duplicate sale. `POST /api/stocks` is admin-only and accepts
`product_id`, a positive integer `quantity`, and an optional `note`. `GET /api/stocks`
returns recent additions and a `version` cursor for cashier notifications.

## Validation commands

```powershell
cd backend
composer test

cd ..\frontend
npm run lint
npm run build

cd ..\mobile
npm run lint
npx expo export --platform web
```
