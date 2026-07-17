#!/usr/bin/env bash
# One-shot deploy on the VPS (run as root from /opt/carsaction).
set -euo pipefail

APP_DIR=/opt/carsaction
DOMAIN=carsaction.sg

cd "$APP_DIR"

if [[ ! -f .env.production ]]; then
  echo "Missing .env.production — copy from .env.production.example and fill secrets."
  exit 1
fi

# Load compose DB vars
set -a
# shellcheck disable=SC1091
source .env.production
set +a

if [[ -z "${POSTGRES_PASSWORD:-}" || "${POSTGRES_PASSWORD}" == *"CHANGE_ME"* ]]; then
  echo "Set a strong POSTGRES_PASSWORD in .env.production first."
  exit 1
fi

echo "==> Pulling latest code"
git fetch --all
git reset --hard origin/main

echo "==> Building and starting containers"
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

echo "==> Waiting for app health"
for i in $(seq 1 40); do
  if curl -fsS http://127.0.0.1:3000/robots.txt >/dev/null 2>&1; then
    echo "App is responding."
    break
  fi
  sleep 3
  if [[ "$i" -eq 40 ]]; then
    echo "App did not become ready. Check: docker compose -f docker-compose.prod.yml logs -f app"
    exit 1
  fi
done

echo "==> Nginx site"
if [[ ! -f /etc/nginx/sites-available/carsaction ]]; then
  cp deploy/nginx-carsaction.conf /etc/nginx/sites-available/carsaction
  ln -sf /etc/nginx/sites-available/carsaction /etc/nginx/sites-enabled/carsaction
fi
nginx -t && systemctl reload nginx

echo "Deploy complete (HTTP). After DNS points here, run:"
echo "  certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
