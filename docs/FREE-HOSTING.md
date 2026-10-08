# Free backend setup: Render + Neon

Your Vercel frontend stays where it is. This setup hosts Laravel on Render's
Free web service and stores data in Neon's Free PostgreSQL database. Local SQLite
is unchanged. The hosted database starts with two products and 50 sample sales;
it does not copy your computer's existing transactions.

## 1. Create the database in Neon

1. Sign up at https://console.neon.tech using GitHub or email.
2. Create a project named `waterrefillingpos` on the **Free** plan. Choose a
   region near your Render service (Singapore if available).
3. Open **Connect**. Copy the PostgreSQL connection string. It looks like:
   `postgresql://USER:PASSWORD@HOST/neondb?sslmode=require`.
4. Keep this string private. Paste it only into Render's `DB_URL`, not Vercel,
   GitHub, or chat. Use the direct connection (pooling disabled) for this small app.

## 2. Create the API in Render

1. Sign up at https://dashboard.render.com with GitHub.
2. Select **New → Blueprint** and connect `ItzRenzo/WaterRefillingPOS`.
3. Select branch `main`. Render reads the repository's `render.yaml`.
4. Review that the service's plan is **Free**. Enter the prompted values:

   | Variable | Value |
   | --- | --- |
   | `DB_URL` | Your private Neon PostgreSQL connection string |
   | `CORS_ALLOWED_ORIGINS` | Your Vercel production origin, e.g. `https://your-project.vercel.app`, without a trailing slash |
   | `POS_INITIAL_ADMIN_PASSWORD` | The password you want for username `admin` |
   | `POS_INITIAL_CASHIER_PASSWORD` | The password you want for username `walton` |

   Find your stable production domain in Vercel's **Settings → Domains**. The
   deployment-specific URL you shared may change on your next deployment. Add
   any exact preview origin you want to use as a comma-separated second value.

5. Apply the Blueprint and wait for the deploy to finish. Docker installs PHP
   dependencies; startup runs migrations and initializes an empty database.
   Later restarts preserve account passwords, transactions, and stock quantities.
6. Copy the service's URL, e.g. `https://waterrefillingpos-api.onrender.com`.
7. Open that URL followed by `/api/health`. Wait for the free service to wake up.
   It should return JSON containing `"status":"ok"`.

The Blueprint generates `APP_KEY` automatically. Keep it stable. No SQLite file,
local `.env`, or database credentials are included in the Docker image.

## 3. Connect Vercel

1. Open your Vercel project → **Settings → Environment Variables**.
2. Add `VITE_API_BASE` with your actual Render URL followed by `/api`:

   ```dotenv
   VITE_API_BASE=https://waterrefillingpos-api.onrender.com/api
   ```

   The URL above is an example; use the URL Render gave your service.
3. Apply to **Production** and **Preview**, then redeploy the latest `main`.
4. Open the production website. Sign in as `admin` or `walton` using the passwords
   you entered in Render.
5. Add stock, log in as cashier, complete a cash sale, and check that the stock and
   transaction persist after a Render restart.

## Optional Ask AI and mobile connection

Add `GEMINI_API_KEY` to Render's environment to enable Ask AI, then redeploy.
For the Expo app, set `EXPO_PUBLIC_API_BASE` to the same Render URL ending in `/api`
and rebuild/restart Expo. No Gemini/database secret belongs in either client.

## If something fails

- Missing backend connection: confirm `VITE_API_BASE` was applied to the deployment's
  environment and redeploy Vercel.
- Cannot reach server: open Render's `/api/health`, wait for startup, and check
  `CORS_ALLOWED_ORIGINS` matches the website's exact origin.
- Render deploy failure: open **Logs**. Check the Neon connection string,
  PostgreSQL SSL setting, and that both initial passwords were supplied.
- Incorrect username/password: hosted accounts use the initial passwords you
  supplied in Render. Changing the environment variables later does not reset them.

## Free plan limits

Render Free services sleep after 15 idle minutes and can take about a minute to
wake. Its local filesystem is temporary, so all sales/stock data lives in Neon.
Free tiers have usage limits; check your dashboards. Docker and a live Neon
connection must be verified by the first cloud deployment.

Sources: [Render free services](https://render.com/docs/free),
[Docker on Render](https://render.com/docs/docker),
[Neon Laravel guide](https://neon.com/docs/guides/laravel),
[Neon plans](https://neon.com/pricing).
