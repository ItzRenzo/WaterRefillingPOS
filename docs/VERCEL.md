# Deploy the web POS to Vercel

For the free backend option using Render and Neon PostgreSQL, follow
[Free hosting setup](FREE-HOSTING.md). It includes the Vercel connection steps.

The React web frontend runs on Vercel. Laravel runs on a PHP 8.3+ host with a
persistent SQLite disk (or a supported managed SQL database). The SQLite file in
this repository cannot store live sales on Vercel's ephemeral filesystem.
See [Vercel's SQLite guidance](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel).

## 1. Host the Laravel API

Configure the PHP host's document root as `backend/public`, install Composer
production dependencies, and set the backend environment:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.your-domain.com
APP_KEY=your_generated_laravel_key
APP_TIMEZONE=Asia/Manila
CORS_ALLOWED_ORIGINS=https://your-project.vercel.app
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/on/persistent-disk/pos.sqlite
```

Create the database file on a persistent volume and grant the PHP process write
access to it, `storage`, and `bootstrap/cache`. Keep `APP_KEY` stable across
deployments. Generate it once with `php artisan key:generate --show`.

Run on the backend host:

```sh
composer install --no-dev --optimize-autoloader
php artisan migrate --force
# For a NEW demonstration database only:
php artisan db:seed --force
php artisan config:cache
php artisan route:cache
```

The demonstration seeder creates admin/admin123 and walton/cashier123 plus sample
sales. Change those passwords before public use. Do not rerun the user seeder on
an established production database: it resets those accounts' passwords.
To preserve current data, transfer your existing SQLite database with the API
stopped rather than reseeding it. Never overwrite that persistent file during deployments.

Confirm `https://api.your-domain.com/api/health` returns JSON. Configure
`GEMINI_API_KEY` only on this backend if using Ask AI.

## 2. Import GitHub into Vercel

1. Import `ItzRenzo/WaterRefillingPOS`, branch `main`.
2. Leave **Root Directory** at the repository root (`.`), not `frontend`.
3. Choose Vite and Node.js 24.x. The root `vercel.json` defines installation,
   build, output directory, and SPA refresh routing.
4. Set **VITE_API_BASE** to `https://api.your-domain.com/api` for Production and
   Preview. This URL is public; it must include `/api`.
5. Deploy. If the hosted API URL is missing, the frontend still builds with a
   warning so you can preview the website. Login, sales, inventory, and Ask AI
   require the hosted API. An explicitly configured invalid URL fails the build.
   Changing this value requires a new deployment because Vite embeds it at build time.
6. Set the backend's `CORS_ALLOWED_ORIGINS` to the exact frontend URL. For a
   custom domain or preview deployment, add its exact origin, comma-separated,
   without paths or trailing slashes. Run `php artisan config:cache` after changes.

No database passwords or Gemini API keys belong in Vercel's `VITE_*` variables.
The browser authenticates using the existing Sanctum bearer token, without
cross-site cookies. Local `npm run dev` still proxies `/api` to port 8000.

## 3. Verify the deployment

If login reports that the backend connection is not configured, set
`VITE_API_BASE` in Vercel and redeploy. `/api` on the Vercel frontend has no Laravel
server. A 404 from that address cannot be fixed by changing POS passwords.

Open the Vercel URL on desktop and a phone. Sign in, check product stocks, add
stock as admin, refresh as cashier, complete a cash sale, and open its receipt.
Confirm the updated inventory survives restarting/redeploying the API host.
Test Ask AI if its backend key is configured. A published frontend alone cannot
sign in or process sales without the hosted API.

## Which interface does a phone use?

A phone browser opening the Vercel URL uses `frontend`: the same web design,
adapted to its screen using responsive CSS. It does not switch to the Expo app.
The `mobile` interface runs through Expo Go or an installed Android/iOS app and
can connect to the same hosted API via `EXPO_PUBLIC_API_BASE`.

[Vercel's Vite documentation](https://vercel.com/docs/frameworks/frontend/vite)
