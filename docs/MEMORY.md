# CARSaction — Decision Log

Append to this as the build goes. Never delete. This is what stops you re-litigating settled
decisions and re-explaining context to a fresh AI session.

## Settled decisions

**2026-07-14 — Stack: Next.js full stack, not Next + FastAPI.**
Reason: two milestone budget, no compute heavy service, fewer moving parts, faster build.
Auction close is a cron job and a SQL query, not a service.

**2026-07-14 — Stripe account belongs to Macy, not Raza.**
Pakistan is not a Stripe supported country. Singapore is. Build against test keys, she provides
live keys at handover. She needs to complete Stripe business verification. FLAG THIS TO HER EARLY,
it is a hard blocker for launch and verification takes days.

**2026-07-14 — No scraping of sgcarmart.**
Macy asked twice (once directly, once as "scrape but don't show on frontend"). Refused both times.
Singapore precedent: PropertyGuru v 99.co, 99.co scraped listings, got a cease and desist, settled
and agreed to stop. Listing photos and dealer written descriptions are copyrighted. She is trying to
sell subscriptions to the exact dealers whose listings she would be copying. Risk is hers, not just
his. Alternative offered: dealers post their own inventory, plus a bulk upload tool later.

**2026-07-14 — Sealed timed bidding, not live bidding.**
Dealers cannot see each other's bids while an auction runs. Confirmed by Macy in writing.
Live real time bidding is a future paid stage.

**2026-07-14 — Scope locked in writing, sent as a document.**
Out of scope and confirmed as future paid stages: Smart Match, live bidding, multiple bidding rounds
and the re-bid button, per finance company configurable rules, AI pricing, AI chatbot, advertising
space, car plate listings, bulk CSV import, mobile apps.

**2026-07-14 — Milestone 1 paid, USD 325, Payoneer. Milestone 2 will be USD 300 on Upwork.**
Raza wants the Upwork contract to build his profile there and reduce Fiverr dependence.

## Open questions for Macy

- [ ] **Gold tier listing limit.** She never confirmed the number. Default is 10 active listings.
      Built as an admin editable value so she can change it herself. Confirm before launch.
- [ ] **Gold and Platinum monthly prices in SGD.** Her ChatGPT thread suggested 49 / 99 / 199 / 399
      but she has not committed. Needed to create the Stripe Products.
- [ ] **Stripe account.** She must create it under her Singapore entity and complete verification.
      Blocker for going live. Raise this now, not at handover.
- [ ] **Direct owner listings.** She mentioned a one time fee model like SGCM's 68 SGD per listing.
      Not in the milestone 1 scope document. Do not build. Confirm it is a later stage.

## Things to watch

- She expands scope constantly, usually after a ChatGPT session. Every new idea gets checked against
  the scope document and flagged as a paid stage if it is not in it.
- She believes AI makes builds instant because Lovable made her a static mockup fast. Do not promise
  fast turnarounds to match that belief.
- She negotiates hard, including guilt and appeals to future generosity. Deal is locked at 650.
  Do not reopen it.
- Her launch target was "end of July". That is not realistic for both milestones. Do not commit to it.
  Milestone 1 alone is roughly 2 to 3 weeks of solid work.

## Build log

(append entries here as work progresses)
