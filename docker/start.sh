#!/bin/sh
# render-start.sh — Runs on every Render container boot
# Safe to run multiple times (all commands are idempotent)

set -e

echo "=== Notak2 Boot Sequence ==="

# NOTE: For Supabase — migrations use DB_URL which should point to the DIRECT connection
# (db.[ref].supabase.co:5432), NOT the PgBouncer pooler (port 6543).
# The app itself can use the session-mode pooler (port 5432 on pooler host).
# Set DB_MIGRATION_URL in Render env if you want separate migration vs app connections.

# 1. Generate app key if not set
if [ -z "$APP_KEY" ]; then
  echo "[!] APP_KEY not set — generating..."
  php artisan key:generate --force
fi

# 2. Run migrations (safe — won't re-run completed ones)
echo "[1/4] Running migrations..."
php artisan migrate --force --no-interaction

# 3. Seed admin/CI accounts (uses firstOrCreate — safe to re-run)
echo "[2/4] Seeding privileged accounts..."
php artisan db:seed --force --no-interaction

# 4. Clear & rebuild caches (stored in DB — ephemeral-safe)
echo "[3/4] Warming caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 5. Create storage symlink (public disk — harmless if already exists)
echo "[4/4] Storage link..."
php artisan storage:link 2>/dev/null || true

echo "=== Boot complete. Starting services... ==="

# Start supervisor (nginx + php-fpm)
exec /usr/bin/supervisord -c /etc/supervisord.conf
