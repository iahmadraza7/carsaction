# CARSaction — Project Context

Read this first. Every coding session starts here.

## What we are building

A Singapore car marketplace with dealer subscriptions and a repo vehicle bidding system.
Competitor: sgcarmart.com. We win on transparency and a digitised repo bidding workflow.

Client: Macy (OPPT Group), Singapore real estate agent, non technical.
Developer: Ahmad Raza.
Contract: USD 650, two milestones. Milestone 1 paid.
Domain: carsaction (client owns it).

## Two user problems we solve

1. **Dealers** pay SGCM 600 to 960 SGD monthly, charged per vehicle per month whether cars sell or not.
   We offer flat monthly subscriptions with generous listing limits. Predictable cost.

2. **Repo finance companies** currently run vehicle disposal by email. They email a template to dealers,
   dealers fill a form and email it back before a deadline, staff manually compile bids into Excel.
   We digitise this entirely: they post vehicles, dealers bid from their dashboard, the system
   consolidates and ranks bids, they award the winner. This is the killer feature.

## Scope: what is IN

**Milestone 1 — Core Platform (paid, building now)**
- Three roles: buyer, dealer, admin
- Car listings: photo gallery, full specs, price, dealer info
- Search and filters: make, model, price, year, mileage, body type
- Dealers post, edit, delete their own listings
- Sold listings can be switched back to For Sale
- WhatsApp button on listings to contact the dealer directly (same as HomeGPT)
- Two subscription tiers: Gold (limited listings), Platinum (unlimited)
- Real recurring monthly payment via Stripe
- Listing limit enforced automatically per tier
- Dealer can upgrade, downgrade, cancel
- Dealer dashboard: their listings, subscription status, enquiries
- Admin dashboard: manage all users, listings, dealers, subscriptions

**Milestone 2 — Repo Bidding (next, USD 300 on Upwork)**
- Finance company role and login
- Finance company posts repo vehicles with photos and specs
- Close date and time set per auction
- Dedicated tab showing all vehicles open for bidding
- Subscribed dealers place bids from their dashboard
- Dealers edit their bid any time before close
- Unsubscribed dealers can VIEW repo vehicles but cannot bid (drives subscriptions)
- Dealer sees own bid history per vehicle
- Auction closes automatically at set time, no bids after
- System consolidates and ranks all bids, highest first
- Finance company dashboard: all bids per vehicle, at a glance and full list
- Award to highest bidder button
- Winner notified in app and by email
- Full audit record of every auction and bid
- Sealed bidding: dealers do NOT see each other's bids while running

## Scope: what is OUT (do not build, these are future paid stages)

- Smart Match (buyer preference scoring, top 10 recommendations)
- Live real time bidding (bids updating live for all dealers)
- Multiple bidding rounds / re-bid button / counter offers / multi level approvals
- Per finance company configurable bidding rules
- AI fair price indicator, market insights
- AI enquiry chatbot
- Advertising space for merchants, insurance, loans
- Car plate number listings
- Bulk CSV import
- Mobile apps

If the client asks for any of these mid build, they are a separate paid stage. Do not silently absorb them.

## Hard constraints

- **Stripe account belongs to the client (Singapore entity), not the developer.** Pakistan is not a
  Stripe supported country. Build the integration to run on the client's Stripe keys. Use test keys
  in development, client supplies live keys at handover.
- **No scraping of sgcarmart.** Client asked twice. Refused: Singapore precedent (PropertyGuru v 99.co,
  scraped listings, cease and desist, settled). Listings come from dealers posting their own inventory.
- Currency is SGD.
- Deploy target: client's Hostinger VPS (KVM2), other sites already running on it.

## Client behaviour notes (important)

- She is warm and long term but negotiates hard and expands scope constantly.
- She uses ChatGPT to brainstorm and arrives with big new ideas mid project.
- She thinks AI builds things "in minutes" because she made a Lovable mockup fast. It is a static
  mockup with no backend. Manage expectations on timing.
- She believes CARSaction is "simpler than HomeGPT". It is not, it is several times bigger.
- Anything not in the IN list above gets flagged as a paid stage, politely, in writing.

## Quality bar

This is a production build, not a demo. It must be solid enough to put in front of licensed motor
dealers and finance companies. Better UI/UX than sgcarmart, which is dated and cluttered.
Nothing gets marked done until it is tested end to end on the live deployment.
