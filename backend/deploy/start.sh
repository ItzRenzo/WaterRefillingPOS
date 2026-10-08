#!/bin/sh
set -eu

: "${APP_KEY:?Set APP_KEY in the hosting environment}"
: "${DB_URL:?Set DB_URL to your Neon PostgreSQL connection string}"
: "${CORS_ALLOWED_ORIGINS:?Set CORS_ALLOWED_ORIGINS to your Vercel production origin}"

# Render generates a base64-encoded 256-bit secret for generateValue.
case "$APP_KEY" in
    base64:*) ;;
    *) APP_KEY="base64:$APP_KEY"; export APP_KEY ;;
esac
export APP_URL="${APP_URL:-${RENDER_EXTERNAL_URL:-http://localhost:10000}}"
port="${PORT:-10000}"
case "$port" in *[!0-9]*|'') echo "PORT must be numeric" >&2; exit 1 ;; esac
sed -i "s/^Listen 80$/Listen $port/" /etc/apache2/ports.conf
sed -i "s/\*:10000/*:$port/" /etc/apache2/sites-available/000-default.conf

php artisan config:clear
php artisan migrate --force
php artisan pos:initialize-hosted
php artisan config:cache
php artisan route:cache
chown -R www-data:www-data storage bootstrap/cache
exec apache2-foreground
