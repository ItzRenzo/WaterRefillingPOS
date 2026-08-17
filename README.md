# Water Refilling POS

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

For a physical phone, replace `localhost` in `mobile/.env.local` with the
computer's LAN IP address and run Laravel on the network:

```powershell
php artisan serve --host=0.0.0.0
```

## Checks

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
