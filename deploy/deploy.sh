#!/usr/bin/env bash
# One-shot deploy on the VPS (run as root from /opt/carsaction).
# Does NOT touch /opt/homegpt or other sites.
set -euo pipefail

APP_DIR=/opt/carsaction
DOMAIN=carsaction.sg
COMPOSE="docker compose -p carsaction -f docker-compose.prod.yml --env-file .env"

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy from .env.production.example and fill secrets."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

if [[ -z "${POSTGRES_PASSWORD:-}" || "${POSTGRES_PASSWORD}" == *"CHANGE_ME"* ]]; then
  echo "Set a strong POSTGRES_PASSWORD in .env first."
  exit 1
fi

echo "==> Pulling latest code"
git fetch --all
git reset --hard origin/main

echo "==> Building and starting carsaction stack (port 8100)"
$COMPOSE up -d --build

echo "==> Waiting for app on 127.0.0.1:8100"
for i in $(seq 1 40); do
  if curl -fsS http://127.0.0.1:8100/robots.txt >/dev/null 2>&1; then
    echo "App is responding on 127.0.0.1:8100"
    break
  fi
  sleep 3
  if [[ "$i" -eq 40 ]]; then
    echo "App did not become ready. Check: $COMPOSE logs -f app"
    exit 1
  fi
done

echo "==> Nginx site (HTTP only; Certbot adds SSL later)"
if [[ ! -f /etc/nginx/sites-available/carsaction ]]; then
  cp deploy/nginx_carsaction.conf /etc/nginx/sites-available/carsaction
fi
ln -sf /etc/nginx/sites-available/carsaction /etc/nginx/sites-enabled/carsaction
nginx -t && systemctl reload nginx

echo "Deploy complete (HTTP)."
echo "After DNS A records point here, run:"
echo "  certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo "Confirm HomeGPT still up: curl -I https://homegpt.sg  (or your live URL)"
