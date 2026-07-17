# CARSaction — Production Deploy (Hostinger VPS + Awesome Sites + Docker)

Domain: **carsaction.sg** (Awesome Sites)  
VPS: **187.77.148.141** (Hostinger Ubuntu 24.04)

---

## A. DNS on Awesome Sites (do this first)

1. Log in to [awesomesites.org](https://awesomesites.org) → Domains → **carsaction.sg**.
2. Open **Nameservers** only if Hostinger told you to use their NS. Prefer keeping Awesome Sites DNS and adding records:
3. Find **DNS Management** / DNS Zone (may be under the domain manage menu). Add:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | `@` | `187.77.148.141` | 300 |
| A | `www` | `187.77.148.141` | 300 |

4. Wait until `nslookup carsaction.sg` shows `187.77.148.141`.
5. SSL (“No SSL Detected” in Awesome Sites) is normal — **Certbot on the VPS** issues the real certificate after DNS points here. You do not buy SSL from Awesome Sites for this setup.

---

## B. One-time: allow deploy SSH key on the VPS

On your PC, a key was generated at `~/.ssh/carsaction_vps`.

**In your existing SSH session** (`ssh root@187.77.148.141`), paste:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINluQf+1FkBwheQoBQ4IIEQMheti67ihnjyZ+AIiVvv/ carsaction-deploy' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Then from Windows PowerShell test:

```powershell
ssh -i $env:USERPROFILE\.ssh\carsaction_vps root@187.77.148.141 "echo ok"
```

---

## C. Security built into the app

- Rate limits on login (`/api/auth/*`), register, dealer register, forgot/reset password
- Security headers: HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy
- `X-Powered-By` disabled; Next `output: "standalone"`
- Suspended users cannot sign in
- Zod validation on every mutation; listing limits enforced server-side
- Stripe state only from webhooks
- Postgres **not** published to the internet (Docker internal network)
- App bound to `127.0.0.1:3000` only; Nginx terminates TLS
- Host script: UFW + Fail2ban (SSH) + unattended upgrades (`deploy/harden-vps.sh`)

---

## D. First deploy (after SSH key works)

### 1. Host packages

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl git nginx certbot python3-certbot-nginx
# Docker
curl -fsSL https://get.docker.com | sh
```

### 2. Clone + env

```bash
mkdir -p /opt/carsaction
cd /opt/carsaction
git clone https://github.com/iahmadraza7/carsaction.git .
cp .env.production.example .env.production
nano .env.production   # fill secrets — see checklist below
chmod +x deploy/*.sh
```

**Required secrets in `.env.production`:**

```bash
POSTGRES_PASSWORD=$(openssl rand -base64 24)
AUTH_SECRET=$(openssl rand -base64 32)
# then set AUTH_URL / NEXT_PUBLIC_APP_URL to https://carsaction.sg
# paste Stripe test (or live) keys + price IDs
# RESEND_API_KEY if email should work
```

### 3. Harden host + deploy

```bash
bash deploy/harden-vps.sh
bash deploy/deploy.sh
```

### 4. SSL (only after DNS propagates)

```bash
certbot --nginx -d carsaction.sg -d www.carsaction.sg
```

### 5. Stripe live webhook

Stripe Dashboard → Webhooks → `https://carsaction.sg/api/stripe/webhook`  
Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_succeeded`, `invoice.payment_failed`  
Paste `whsec_...` into `.env.production`, then:

```bash
cd /opt/carsaction && docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build app
```

### 6. Optional: seed once (empty DB only)

```bash
docker compose -f docker-compose.prod.yml exec app sh -c 'npx --yes tsx prisma/seed.ts'
# Prefer creating a real admin instead of leaving seed passwords on production.
```

---

## E. Redeploy after code changes

```bash
cd /opt/carsaction
git pull origin main
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

---

## F. Live smoke test

- [ ] `https://carsaction.sg` loads with valid cert
- [ ] Browse `/cars`, open a listing, WhatsApp link works
- [ ] Register / login rate-limit returns 429 if spammed
- [ ] Dealer subscribe (Stripe test or live)
- [ ] Admin panel, suspend user, edit listing
- [ ] `/sitemap.xml` and `/robots.txt`

---

## G. What Cursor still needs from you

1. Run the **authorized_keys** command on the VPS (section B).
2. Point DNS A records at `187.77.148.141` (section A).
3. Confirm Stripe keys (test first is OK) and Resend if needed.

After (1), say “key added” and the deploy can be finished from here over SSH.
