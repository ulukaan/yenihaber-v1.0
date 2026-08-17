#!/usr/bin/env bash
# Cloud Agent — idempotent kurulum (checkout sonrası bir kez / build snapshot'ında).
# Kurumsalda Hostinger MySQL kullanılır; burada aynı protokolü konuşan MariaDB
# (MySQL uyumlu) lokal geliştirme veritabanı olarak çalışır. Prisma `mysql`
# konnektörüyle birebir uyumludur.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DB_NAME="${MYSQL_DATABASE:-yenihaber}"
DB_USER="${MYSQL_USER:-yenihaber}"
DB_PASS="${MYSQL_PASSWORD:-yenihaber}"
DATABASE_URL_LOCAL="mysql://${DB_USER}:${DB_PASS}@127.0.0.1:3306/${DB_NAME}"

echo "==> [1/6] MariaDB (MySQL uyumlu) sunucusu kuruluyor (gerekiyorsa)"
if ! command -v mariadbd >/dev/null 2>&1 && ! command -v mysqld >/dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mariadb-server mariadb-client
else
  echo "    MariaDB zaten kurulu, atlanıyor."
fi

echo "==> [2/6] MariaDB başlatılıyor"
sudo service mariadb start || sudo service mysql start || true
# Soket hazır olana kadar bekle
for i in $(seq 1 30); do
  if sudo mariadb-admin ping >/dev/null 2>&1 || sudo mysqladmin ping >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "==> [3/6] Veritabanı ve kullanıcı (idempotent)"
sudo mariadb <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL

echo "==> [4/6] Kök .env (yoksa oluştur — mevcut dosya korunur)"
if [ ! -f "$ROOT/.env" ]; then
  cat > "$ROOT/.env" <<ENV
# Cloud Agent lokal geliştirme ortamı (MySQL uyumlu MariaDB).
NODE_ENV=development
DATABASE_URL="${DATABASE_URL_LOCAL}"
JWT_SECRET="dev-local-jwt-secret-please-change-32chars"
API_PORT=4000
API_PREFIX=api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
ENV
  echo "    .env oluşturuldu."
else
  echo "    .env zaten var, korunuyor."
fi

# Bu betiğin geri kalanı için DATABASE_URL'i ortama al
export DATABASE_URL="${DATABASE_URL_LOCAL}"
export NODE_ENV=development

echo "==> [5/6] Bağımlılıklar (pnpm) + Prisma Client + şema push"
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:push

echo "==> [6/6] Seed (yalnızca veritabanı boşsa)"
USER_COUNT="$(mariadb -N -B -h 127.0.0.1 -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" \
  -e "SELECT COUNT(*) FROM User;" 2>/dev/null || echo 0)"
if [ "${USER_COUNT:-0}" = "0" ]; then
  pnpm db:seed
  echo "    Seed tamamlandı (admin@yenihaber.local / Admin123!)."
else
  echo "    Mevcut veri bulundu (User=${USER_COUNT}), seed atlandı."
fi

echo "==> Kurulum tamamlandı."
