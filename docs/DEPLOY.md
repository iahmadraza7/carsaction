# Production deploy — carsaction.sg on Hostinger (beside HomeGPT)

Target: Ubuntu VPS (Hostinger KVM2) at `187.77.148.141`  
Domain: **carsaction.sg** (DNS at Awesome Sites)  
App path: `/opt/carsaction`  
Compose project: `-p carsaction` (containers `carsaction-*`, volumes `carsaction_*`)  
Host bind: **`127.0.0.1:8100` → container `3000`** (HomeGPT keeps `8000`; do not collide)

## Hard rules (coexistence)

- **Do not touch** `/opt/homegpt`, `/opt/mummies-buddy`, or their nginx site files.
- Never run HomeGPT’s compose commands while deploying CarsAction.
- Never bind CarsAction on `0.0.0.0:8100` or open `8100` in UFW to the world — nginx is the only public entry.
- Own Postgres in Docker (`carsaction_pgdata`). Never share HomeGPT’s database.
- Env file: `/opt/carsaction/.env` only (copy from `.env.production.example`).
- Nginx starts **HTTP-only** + ACME challenge. Certbot adds SSL **after** DNS resolves worldwide.
- First smoke: Stripe **test** keys in `.env` is fine; swap to live when the client confirms.

Rollback that never hurts HomeGPT: remove only the CarsAction nginx symlink (section 4).

---

## 0. Local (Windows) before first deploy

```powershell
cd D:\fiverr\carsaction
npm run lint
npx tsc --noEmit
npm run build

git status
git add -A
git commit -m "Milestone 1: production-ready UI, SG filters, Docker deploy for Hostinger"
git push origin main
```

Repo: https://github.com/iahmadraza7/carsaction

---

## 1. DNS on Awesome Sites (before Certbot)

In [Awesome Sites domains](https://awesomesites.org/customer/clientarea.php?action=domains) → **carsaction.sg** → DNS zone:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | `@` | `187.77.148.141` | 300 |
| A | `www` | `187.77.148.141` | 300 |

Wait until both resolve from your PC:

```powershell
nslookup carsaction.sg
nslookup www.carsaction.sg
# both must return 187.77.148.141
```

Do **not** run Certbot until that matches. Awesome Sites “No SSL” is fine — SSL is issued on the VPS.

---

## 2. VPS — packages (skip if already installed)

```bash
ssh root@187.77.148.141

apt update
apt install -y git nginx certbot python3-certbot-nginx
docker --version && docker compose version
```

---

## 3. Clone + `.env`

```bash
mkdir -p /opt/carsaction
cd /opt/carsaction
git clone https://github.com/iahmadraza7/carsaction.git .
cp .env.production.example .env
nano .env
```

Generate secrets:

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -base64 24   # POSTGRES_PASSWORD
```

Required keys in `/opt/carsaction/.env`:

```
POSTGRES_USER=carsaction
POSTGRES_PASSWORD=<strong>
POSTGRES_DB=carsaction
DATABASE_URL=postgresql://carsaction:<same>@db:5432/carsaction?schema=public
AUTH_SECRET=<strong>
AUTH_URL=https://carsaction.sg
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL=https://carsaction.sg
STRIPE_SECRET_KEY=sk_test_...   # or sk_live_... later
STRIPE_WEBHOOK_SECRET=whsec_... # after Stripe Dashboard webhook
STRIPE_PRICE_GOLD=price_...
STRIPE_PRICE_PLATINUM=price_...
RESEND_API_KEY=                 # optional at first
```

Use the **same** password in `POSTGRES_PASSWORD` and `DATABASE_URL`.

---

## 4. Build and start (isolated project)

```bash
cd /opt/carsaction
docker compose -p carsaction -f docker-compose.prod.yml --env-file .env up -d --build

# Health (localhost only)
curl -fsS http://127.0.0.1:8100/robots.txt

# Confirm HomeGPT untouched
docker ps --format '{{.Names}}\t{{.Ports}}' | grep -E 'homegpt|carsaction'
# Expect homegpt still on :8000, carsaction-app on 127.0.0.1:8100
```

Migrations run on app start (`prisma migrate deploy`). Seed once on empty DB (optional):

```bash
docker compose -p carsaction -f docker-compose.prod.yml exec app sh -c 'npx --yes tsx prisma/seed.ts'
# Seed password Password123! — change admin immediately after
```

Or use the helper script (same compose project):

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

---

## 5. Nginx (HTTP only) — does not touch HomeGPT sites

```bash
cp /opt/carsaction/deploy/nginx_carsaction.conf /etc/nginx/sites-available/carsaction
ln -sf /etc/nginx/sites-available/carsaction /etc/nginx/sites-enabled/carsaction
nginx -t && systemctl reload nginx
```

Config listens on port 80, proxies to `http://127.0.0.1:8100`, and serves `/.well-known/acme-challenge/` for Certbot. No `ssl_certificate` lines until Certbot runs.

---

## 6. SSL (only after DNS points here)

```bash
certbot --nginx -d carsaction.sg -d www.carsaction.sg
curl -I https://carsaction.sg
```

---

## 7. Stripe webhook (production URL)

Stripe Dashboard → Webhooks → endpoint:

`https://carsaction.sg/api/stripe/webhook`

Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

Paste `whsec_...` into `/opt/carsaction/.env`, then:

```bash
cd /opt/carsaction
docker compose -p carsaction -f docker-compose.prod.yml --env-file .env up -d --build app
```

---

## 8. Firewall

```bash
ufw status
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
# Do NOT ufw allow 8100
```

---

## 9. Rollback (nginx / HomeGPT worries)

```bash
rm -f /etc/nginx/sites-enabled/carsaction
nginx -t && systemctl reload nginx

# Optional: stop CarsAction only (HomeGPT stays up)
cd /opt/carsaction
docker compose -p carsaction -f docker-compose.prod.yml down
```

HomeGPT stays up as long as you never edit its site file or stop its compose project.

---

## 10. Verification checklist

- [ ] `nslookup carsaction.sg` → `187.77.148.141`
- [ ] `https://carsaction.sg` loads (valid cert)
- [ ] `https://homegpt.sg` (or your live HomeGPT URL) still works
- [ ] Browse `/cars`, open a listing
- [ ] Dealer subscribe (Stripe test card) → webhook → ACTIVE
- [ ] Admin login works

---

## 11. Redeploy later

```bash
cd /opt/carsaction
git pull origin main
docker compose -p carsaction -f docker-compose.prod.yml --env-file .env up -d --build
```

Or: `./deploy/deploy.sh`

---

## File map

| File | Role |
|------|------|
| `docker-compose.prod.yml` | `carsaction` project; app on `127.0.0.1:8100:3000` |
| `deploy/nginx_carsaction.conf` | HTTP-only nginx site + ACME |
| `deploy/deploy.sh` | Pull, compose up, nginx symlink |
| `.env.production.example` | Template → copy to `/opt/carsaction/.env` |
| `Dockerfile` | Multi-stage Next.js production image |

## Operator order (shortest path)

1. Push code to GitHub (local)  
2. Set DNS A records; wait for `nslookup`  
3. SSH → clone `/opt/carsaction` → `.env` → compose up  
4. Nginx HTTP → Certbot  
5. Stripe webhook → smoke test  
6. Never open `8100` on UFW to the world  
