# CARSaction — Design Direction

## The bar

sgcarmart is dated, cluttered and ad heavy. That is the opportunity. CARSaction should feel like a
modern product, not a classifieds board. Think Carousell meets a fintech dashboard.

The client already generated designs in Google Stitch (warm neutrals, amber accent, Geist font) and
a Lovable mockup. Use them as a reference for tone, not as a spec. Her mockups are static, they were
made to pitch with, not to build from.

## Visual direction

- **Palette:** warm off white background, deep charcoal text, one strong accent (amber / burnt orange
  from her Stitch designs). Green only for positive states (Great Deal, bid won), red only for
  destructive.
- **Type:** one clean sans for UI (Geist or Inter). Larger, confident headings. Cars are visual, let
  the photos carry the page.
- **Cards:** generous whitespace, big photo, price prominent, key specs as small pills (year, mileage,
  transmission). No dense tables on the browse page.
- **No ads, no clutter.** The whole pitch is that we are cleaner than SGCM. Do not undermine it.

## Pages that matter most

**Listing detail.** This is where the buyer decides. Big gallery, price and depreciation up top,
full spec table below, COE expiry clearly shown (Singapore buyers check this first), dealer card
with a prominent WhatsApp button. Trust signals: verified dealer badge, listing date.

**Browse / search.** Filters on the left on desktop, a sheet on mobile. Results update from URL params.
Empty state should suggest loosening filters, never a dead end.

**Dealer dashboard.** This is a work tool, not a marketing page. Dense is fine here. Show listing count
against their tier limit prominently (e.g. "7 of 10 active listings"). Make the upgrade path obvious
when they are near the cap. That is how subscriptions get sold.

**Repo auctions (milestone 2).** This is the differentiator, it should feel serious and institutional.
Countdown timer per vehicle, clear "bidding closes in 4h 12m". Dealer's own bid shown clearly.
Finance company dashboard should feel like a control panel: every bid ranked, one click to award.

## Singapore specifics that make it credible

Every real SG car listing shows these. Missing them makes the site look foreign and amateur:

- **COE expiry date** — buyers filter on this
- **Depreciation per year** — the number SG buyers actually compare on
- **OMV / ARF** — standard disclosure
- **Registration date**
- **Road tax**
- Prices in **SGD**

Get these on the listing page and the site instantly reads as legitimate to a Singapore dealer.

## Mobile

Most SG car browsing happens on phones. Every page must work on mobile before it is called done.
The dealer dashboard can be desktop first, but browse and listing detail must be mobile perfect.
