#!/bin/bash
# Start live award test in background; writes full log to /tmp/live-award.log
set -eu
cd /opt/carsaction
# Prisma client is in the app container — run test there, but BASE hits host-mapped port via host network?
# App listens on 3000 inside container; from inside container use http://127.0.0.1:3000
docker cp /tmp/live-award-test.js carsaction-app:/app/live-award-test.js
docker compose -p carsaction -f docker-compose.prod.yml --env-file .env exec -T \
  -e QA_BASE_URL=http://127.0.0.1:3000 \
  -e CLOSE_IN_MS=180000 \
  -w /app app node /app/live-award-test.js
