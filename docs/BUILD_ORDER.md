# CARSaction — Build Order

Build in this order. Each step should end with something that actually runs. Do not move on until
the current step works.

## Phase 0 — Foundation (day 1)

1. `npx create-next-app@latest carsaction --typescript --tailwind --app`
2. Install: prisma, @prisma/client, next-auth@beta, stripe, zod, react-hook-form, sharp, resend
3. `npx shadcn@latest init`
4. Postgres running locally (Docker) and on the VPS
5. Write the full Prisma schema from SCHEMA.md (milestone 1 AND milestone 2 tables, so no rewrite later)
6. `prisma migrate dev`
7. Seed script: 1 admin, 2 dealers, 1 buyer, 8 sample listings, the 2 subscription plans

**Done when:** app runs, DB migrated, seed data visible via Prisma Studio.

## Phase 1 — Auth and roles (day 2)

1. Auth.js with credentials provider + Google
2. Signup flows: buyer signup, dealer signup (dealer creates DealerProfile)
3. Session includes role
4. Middleware protecting `/dealer/*` (DEALER only) and `/admin/*` (ADMIN only)
5. Login, signup, forgot password pages

**Done when:** you can register as each role and get blocked from the wrong dashboard.

## Phase 2 — Listings, public side (day 3 to 5)

1. Listing detail page: image gallery, all specs (including COE, OMV, ARF, depreciation), dealer card
2. WhatsApp contact button, deep links to `wa.me/<number>` with a prefilled message about the car
3. Enquiry form as a fallback, writes to Enquiry table
4. Browse page: grid of listing cards
5. Search and filters: make, model, price range, year range, mileage, body type, fuel, transmission
   - Filters must be URL driven (searchParams) so results are shareable and SEO friendly
6. Sorting: newest, price low to high, price high to low, mileage
7. Favourites (buyer must be logged in)

**Done when:** a stranger can browse, filter, open a car, and WhatsApp the dealer.

## Phase 3 — Dealer dashboard (day 6 to 8)

1. Dealer dashboard shell with nav
2. Create listing form: all fields, multi image upload with reorder, sharp resize on upload
3. Edit and delete own listings
4. Mark SOLD, and switch SOLD back to FOR_SALE
5. Listing limit enforcement, server side, with a clear message when the cap is hit
6. Enquiries list

**Done when:** a dealer can run their whole inventory without touching the DB.

## Phase 4 — Subscriptions and Stripe (day 9 to 11)

This is the riskiest part. Budget real time for it.

1. Pricing page: Gold vs Platinum, pulled from the SubscriptionPlan table
2. Stripe Checkout session for subscribing
3. Webhook handler: `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.payment_failed`
   - This is where the state actually changes. Never trust the redirect, trust the webhook.
4. Update DealerProfile: subscriptionStatus, tier, stripeCustomerId, stripeSubscriptionId,
   currentPeriodEnd
5. Stripe Customer Portal for upgrade, downgrade, cancel, payment method change
6. Gate listing creation on subscriptionStatus == ACTIVE
7. Handle PAST_DUE: dealer keeps listings visible for a grace period, cannot add new ones

**Test with Stripe CLI** (`stripe listen --forward-to localhost:3000/api/stripe/webhook`).
Test the failure paths: card declined, subscription cancelled mid month, downgrade while over the
Gold listing limit (existing listings stay, new ones blocked).

**Done when:** a real test card subscribes, the dealer unlocks listings, cancelling re-locks them.

## Phase 5 — Admin panel (day 12 to 13)

1. Admin dashboard: counts (dealers, listings, active subscriptions, revenue)
2. Manage users: view, search, change role, suspend
3. Verify dealers (verified flag)
4. Manage all listings: view, edit, remove
5. Manage subscription plans: edit tier name, price, listing limit (so Macy can change the Gold cap
   without calling you)
6. View all enquiries

**Done when:** Macy can run the platform without you.

## Phase 6 — Polish and deploy (day 14 to 16)

1. Landing page: the pitch. Transparent pricing, dealer subscriptions, repo bidding coming
2. Responsive check on mobile, most SG car buyers browse on phones
3. SEO: metadata, OG images on listing pages, sitemap
4. Error states, loading states, empty states
5. Deploy to the Hostinger VPS: Docker Postgres, Next build, Nginx reverse proxy, Certbot SSL
6. Point the carsaction domain at it
7. Stripe webhook registered against the live URL

**Done when:** it is live on the real domain, over HTTPS, and a real subscription works end to end
in Stripe test mode.

## Before showing Macy

Run through this yourself, on the live URL, as a real user:

- [ ] Register a buyer, browse, filter, favourite, WhatsApp a dealer
- [ ] Register a dealer, subscribe with a test card, post 3 listings with photos
- [ ] Hit the Gold listing limit, see the correct message
- [ ] Upgrade to Platinum, post more
- [ ] Mark one SOLD, switch it back to FOR_SALE
- [ ] Cancel the subscription, confirm listing creation locks
- [ ] Log in as admin, change the Gold limit, verify it takes effect
- [ ] Open the site on a phone, check every page
- [ ] Check Stripe dashboard shows the subscription correctly

Do not tell her it is done before every box is ticked. She will show this to real dealers.

## Milestone 2 (after payment, on Upwork)

1. Finance company role, signup, profile, admin verification
2. Post repo vehicle form, with images, reserve price, bidding window
3. Public + dealer facing "Repo Auctions" tab, list of open vehicles with countdown
4. Bid placement from dealer dashboard, edit until close, one bid per dealer per vehicle
5. BidHistory audit trail on every edit
6. Unsubscribed dealers: can view, cannot bid, upgrade prompt shown
7. Auto close job: cron flips OPEN to CLOSED at biddingClosesAt
8. Finance company dashboard: all bids per vehicle, ranked highest first, full list plus top bids
9. Award to highest bidder button, sets winningBidId, status AWARDED
10. Email + in app notification to the winning dealer
11. Full audit record view for admin

**Sealed bidding.** Dealers never see other dealers' bids while the auction runs. Enforce server side.
