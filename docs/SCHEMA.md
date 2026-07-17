# CARSaction — Data Model

Milestone 1 tables are required now. Milestone 2 tables are included so the schema is designed
correctly up front and repo bidding drops in without a rewrite.

## Milestone 1

### User
Roles: BUYER, DEALER, ADMIN, FINANCE_CO (finance co unused until milestone 2, but the enum exists now)

```
id              String   @id @default(cuid())
email           String   @unique
passwordHash    String?
name            String
phone           String?
role            Role     @default(BUYER)
suspended       Boolean  @default(false)  // admin can lock an account without deleting it
createdAt       DateTime @default(now())

dealerProfile   DealerProfile?
financeProfile  FinanceProfile?   // milestone 2
favourites      Favourite[]
bids            Bid[]             // milestone 2
```

### DealerProfile
A dealer is a User with a business profile and a subscription.

```
id                    String   @id @default(cuid())
userId                String   @unique
businessName          String
uen                   String?          // SG business registration number
address               String?
whatsappNumber        String           // for the WhatsApp contact button
logoUrl               String?
verified              Boolean  @default(false)   // admin verifies dealers

subscriptionStatus    SubStatus @default(NONE)   // NONE, ACTIVE, PAST_DUE, CANCELLED
tier                  Tier?                      // GOLD, PLATINUM
stripeCustomerId      String?
stripeSubscriptionId  String?
currentPeriodEnd      DateTime?

listings              Listing[]
```

**Listing limit rule:** GOLD has a fixed cap on ACTIVE listings (value configurable by admin, client
has not finalised the number, default 10). PLATINUM is unlimited. The cap counts listings with
status FOR_SALE. SOLD listings do not count against the cap. Enforce this server side on create.

### Listing

```
id            String   @id @default(cuid())
dealerId      String
title         String
make          String
model         String
variant       String?
year          Int
price          Decimal          // SGD
mileage       Int              // km
bodyType      BodyType         // SEDAN, SUV, HATCHBACK, MPV, COUPE, WAGON, VAN, TRUCK
fuelType      FuelType         // PETROL, DIESEL, HYBRID, ELECTRIC
transmission  Transmission     // AUTO, MANUAL
engineCc      Int?
colour        String?
regDate       DateTime?        // SG registration date
coeExpiry     DateTime?        // COE expiry, important in Singapore
depreciation  Decimal?         // SGD per year, standard SG listing field
omv           Decimal?         // Open Market Value, SG specific
arf           Decimal?         // Additional Registration Fee, SG specific
description   String?
status        ListingStatus @default(FOR_SALE)   // FOR_SALE, SOLD, DRAFT
images        ListingImage[]
viewCount     Int      @default(0)
createdAt     DateTime @default(now())
updatedAt     DateTime @updatedAt
```

Note: COE, OMV, ARF and depreciation are standard fields on every Singapore car listing.
Including them is what makes this look credible next to sgcarmart. They are plain input fields,
no calculation logic required.

### ListingImage
```
id         String @id @default(cuid())
listingId  String
url        String
order      Int
```

### Favourite
```
id         String @id @default(cuid())
userId     String
listingId  String
@@unique([userId, listingId])
```

### Enquiry
Buyer contacts dealer. WhatsApp is the main channel, but log the enquiry so the dealer
dashboard can show it.
```
id         String @id @default(cuid())
listingId  String
buyerId    String?
name       String
phone      String
message    String?
createdAt  DateTime @default(now())
```

### SubscriptionPlan (admin configurable)
So Macy can change tier pricing and limits without a code change.
```
id             String @id @default(cuid())
tier           Tier   @unique       // GOLD, PLATINUM
name           String
monthlyPrice   Decimal              // SGD
listingLimit   Int?                 // null = unlimited
stripePriceId  String
active         Boolean @default(true)
```

### Payment (subscription billing history)
One row per Stripe invoice. Written only from webhooks
(`invoice.payment_succeeded` / `invoice.payment_failed`), never from a redirect.
```
id                    String @id @default(cuid())
dealerId              String
stripeInvoiceId       String?  @unique
stripePaymentIntentId String?
amount                Decimal           // SGD
currency              String  @default("sgd")
status                PaymentStatus     // PAID, FAILED, REFUNDED
tier                  Tier?
description           String?
periodStart           DateTime?
periodEnd             DateTime?
createdAt             DateTime @default(now())
```

### Sale (car-sale transaction)
Created when a dealer marks a listing SOLD; removed if they switch it back to FOR_SALE.
One sale per listing.
```
id         String @id @default(cuid())
listingId  String @unique
dealerId   String
salePrice  Decimal          // SGD
buyerName  String?
buyerPhone String?
notes      String?
soldAt     DateTime @default(now())
createdAt  DateTime @default(now())
```

## Milestone 2 (design now, build later)

### FinanceProfile
```
id            String @id @default(cuid())
userId        String @unique
companyName   String
uen           String?
contactPerson String?
verified      Boolean @default(false)
repoVehicles  RepoVehicle[]
```

### RepoVehicle
A vehicle put up for bidding by a finance company.
```
id             String @id @default(cuid())
financeCoId    String
make           String
model          String
year           Int
mileage        Int
bodyType       BodyType
colour         String?
regDate        DateTime?
coeExpiry      DateTime?
condition      String?
location       String?          // where the vehicle can be viewed
reservePrice   Decimal?         // optional, only finance co sees this
description    String?
images         RepoImage[]

biddingOpensAt DateTime
biddingClosesAt DateTime
status         AuctionStatus @default(OPEN)   // OPEN, CLOSED, AWARDED, CANCELLED

bids           Bid[]
winningBidId   String?
awardedAt      DateTime?
createdAt      DateTime @default(now())
```

### Bid
One bid per dealer per vehicle. Editable until close. Store edit history for the audit trail.
```
id             String @id @default(cuid())
repoVehicleId  String
dealerId       String
amount         Decimal          // SGD
createdAt      DateTime @default(now())
updatedAt      DateTime @updatedAt
@@unique([repoVehicleId, dealerId])   // one live bid per dealer per vehicle, they edit it
```

### BidHistory
Audit trail. Every time a dealer edits their bid, write a row. Finance companies and admin
can see the full history. This is what makes it defensible vs the current email process.
```
id             String @id @default(cuid())
bidId          String
amount         Decimal
changedAt      DateTime @default(now())
```

## Rules that must be enforced server side

1. Dealer cannot create a FOR_SALE listing beyond their tier's listing limit.
2. Dealer with subscriptionStatus != ACTIVE cannot create listings or place bids.
3. Unsubscribed dealers CAN view repo vehicles but the bid action is blocked. Show an upgrade prompt.
4. No bid can be created or edited after `biddingClosesAt`. Check on the server, not just the UI.
5. Only the owning finance company (and admin) can see bids for their vehicle before close.
6. Reserve price is never exposed to dealers.
7. Auction auto close: a scheduled job flips status to CLOSED when `biddingClosesAt` passes.
   Bids are ranked by amount desc. The finance company then awards.
