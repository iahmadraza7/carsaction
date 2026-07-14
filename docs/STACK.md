# CARSaction — Tech Stack

## Decisions

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15, App Router, TypeScript | One codebase for frontend and API. Fewer moving parts than a separate FastAPI backend, which matters on a two milestone budget. Server Components keep listing pages fast and SEO friendly, which matters for a marketplace. |
| Database | PostgreSQL | Relational data with real constraints. Listings, subscriptions, bids all need integrity. |
| ORM | Prisma | Type safe, migrations, fast to iterate with an AI coding tool. |
| Auth | Auth.js (NextAuth v5) with credentials + Google | Role based sessions. Self hosted, no vendor lock, runs fine on the VPS. |
| Payments | Stripe (Subscriptions) | Client is a Singapore entity, Stripe fully supports SG including SGD and PayNow. Client owns the account. |
| Images | UploadThing or local disk on VPS | Car listings are image heavy. Start with VPS disk + sharp for resizing, no extra cost. |
| Styling | Tailwind CSS + shadcn/ui | Fast, clean, consistent. Beats sgcarmart's dated UI easily. |
| Email | Resend | Bid notifications, subscription receipts, winner alerts. |
| Hosting | Hostinger VPS KVM2, Docker + Nginx + PM2 | Client already runs other sites there. Postgres in Docker on the same box. |
| Background jobs | node-cron in app, or pg based queue | Needed for auction auto close in milestone 2. Keep it simple, no Redis. |

## Why not FastAPI

Raza normally reaches for Next.js + FastAPI + Postgres. For this scope that adds a second deploy,
a second set of auth plumbing, and CORS overhead for no benefit. The heaviest logic here is auction
close and bid ranking, which is a scheduled job and a SQL query, not a compute service. Keeping it
in Next.js API routes means faster build, fewer tokens burned, one thing to deploy.

If milestone 2 turns out to need heavier background processing, a small worker can be added then.

## Environment variables

```
DATABASE_URL=
AUTH_SECRET=
AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=          # client's Stripe account, test key during dev
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_GOLD=          # Stripe Price ID for Gold tier
STRIPE_PRICE_PLATINUM=      # Stripe Price ID for Platinum tier
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## Stripe setup note

**The Stripe account must be created by Macy under her Singapore entity.** Pakistan is not a supported
Stripe country, so the developer cannot own the account. Plan:

1. Build against Stripe test mode keys during development.
2. At handover, Macy creates the Stripe account, creates the two subscription Products (Gold, Platinum),
   and provides the live keys and Price IDs.
3. Webhook endpoint gets registered against the live domain.

Raise this with Macy early. It is a hard dependency for going live, and she needs time to complete
Stripe's business verification.

## Deployment

VPS already hosts other sites, so:
- Postgres runs in Docker, on a non default port, not exposed publicly
- Next.js app runs behind Nginx as a reverse proxy on the carsaction domain
- SSL via Certbot / Let's Encrypt
- PM2 or Docker restart policy for uptime
