#!/usr/bin/env bash
# Cloud Agent — her açılışta çalışır. MariaDB (MySQL uyumlu) daemon'unu
# idempotent şekilde başlatır ve hazır olana kadar bekler.
set -euo pipefail

echo "==> MariaDB başlatılıyor"
sudo service mariadb start || sudo service mysql start || true

for i in $(seq 1 30); do
  if sudo mariadb-admin ping >/dev/null 2>&1 || sudo mysqladmin ping >/dev/null 2>&1; then
    echo "==> MariaDB hazır."
    exit 0
  fi
  sleep 1
done

echo "!! MariaDB 30 sn içinde hazır olmadı" >&2
exit 1
