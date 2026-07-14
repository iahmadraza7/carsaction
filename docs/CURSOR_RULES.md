# Cursor / Claude Code Rules

Save this as `.cursorrules` in the project root (or `CLAUDE.md` for Claude Code).

---

You are working on CARSaction, a Singapore car marketplace with dealer subscriptions and a repo
vehicle bidding system.

## Before writing any code

Read `docs/PROJECT.md`, `docs/SCHEMA.md` and `docs/BUILD_ORDER.md`. Follow the build order.
Do not jump ahead.

## Stack (do not change these)

Next.js 15 App Router, TypeScript, Prisma, PostgreSQL, Auth.js v5, Stripe Subscriptions,
Tailwind + shadcn/ui, Resend. No separate backend service.

## Rules

- **Server side validation always.** Never trust the client. Listing limits, subscription status,
  bid deadlines and role checks are enforced on the server. The UI hiding a button is not security.
- **Use Server Components by default.** Client components only where interactivity demands it.
- **Zod for every input.** Forms and API routes both.
- **Money is Decimal, never Float.** Currency is SGD.
- **Stripe state comes from webhooks, not redirects.** The redirect can be faked or missed. The
  webhook is the source of truth for subscriptionStatus.
- **Prisma migrations, never manual SQL.**
- No `any`. If typing is hard, model it properly.
- Keep it simple. This is a two milestone budget, not an enterprise platform. Do not add Redis,
  microservices, event buses or abstractions nobody asked for.

## Scope discipline

If a feature is not in the IN list in `docs/PROJECT.md`, do not build it. Specifically do NOT build:
Smart Match, live real time bidding, re-bid / multiple rounds, configurable per company rules,
AI pricing, AI chatbot, ad slots, car plate listings, bulk CSV import.

## Singapore specifics

Listings must include COE expiry, depreciation per year, OMV, ARF, registration date. These are
standard on every SG car listing. Leaving them out makes the product look amateur to real dealers.

## Definition of done

A feature is done when it works end to end on a running app, including the failure paths, not when
the code compiles. For anything touching Stripe, test with the Stripe CLI including declined cards
and cancellations.
