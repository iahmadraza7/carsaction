import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { PaymentStatus, Prisma, SubStatus, SubscriptionSource } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { tierForPriceId } from "@/lib/subscription";

/**
 * Stripe webhook. This is the ONLY place subscription state is trusted; never
 * the browser redirect. Verifies the signature, then syncs DealerProfile.
 *
 * Manual (comped) subscriptions are never overwritten here, unless the dealer
 * completes Stripe Checkout — that flips source to STRIPE and takes over.
 *
 * Test locally with:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook
 */
export async function POST(req: Request) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook verification failed: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          // Checkout is an intentional paid takeover of any MANUAL grant.
          await syncSubscription(subscription, { takeover: true });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        await recordPayment(event.data.object as Stripe.Invoice, PaymentStatus.PAID);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          // Never push PAST_DUE onto a manually granted complimentary sub.
          await prisma.dealerProfile.updateMany({
            where: {
              stripeCustomerId: customerId,
              subscriptionSource: SubscriptionSource.STRIPE,
            },
            data: { subscriptionStatus: SubStatus.PAST_DUE },
          });
        }
        await recordPayment(invoice, PaymentStatus.FAILED);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function mapStatus(status: Stripe.Subscription.Status): SubStatus {
  switch (status) {
    case "active":
    case "trialing":
      return SubStatus.ACTIVE;
    case "past_due":
    case "unpaid":
      return SubStatus.PAST_DUE;
    case "canceled":
    case "incomplete_expired":
      return SubStatus.CANCELLED;
    default:
      return SubStatus.NONE;
  }
}

async function findDealerForSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const dealerProfileId = subscription.metadata?.dealerProfileId;

  if (dealerProfileId) {
    const byId = await prisma.dealerProfile.findUnique({ where: { id: dealerProfileId } });
    if (byId) return byId;
  }
  return prisma.dealerProfile.findFirst({ where: { stripeCustomerId: customerId } });
}

/**
 * Write Stripe subscription state onto the matching DealerProfile.
 * @param takeover — true when the dealer just completed Checkout; flips MANUAL → STRIPE.
 */
async function syncSubscription(
  subscription: Stripe.Subscription,
  opts: { takeover?: boolean } = {},
) {
  const dealer = await findDealerForSubscription(subscription);
  if (!dealer) return;

  if (dealer.subscriptionSource === SubscriptionSource.MANUAL && !opts.takeover) {
    // Complimentary grant stays authoritative until they pay via Checkout.
    return;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const tier = tierForPriceId(priceId);
  const status = mapStatus(subscription.status);

  const item = subscription.items.data[0] as unknown as { current_period_end?: number } | undefined;
  const periodEndUnix =
    item?.current_period_end ??
    (subscription as unknown as { current_period_end?: number }).current_period_end;
  const currentPeriodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : null;

  await prisma.dealerProfile.update({
    where: { id: dealer.id },
    data: {
      subscriptionStatus: status,
      subscriptionSource: SubscriptionSource.STRIPE,
      tier: status === SubStatus.CANCELLED ? null : tier,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      currentPeriodEnd,
    },
  });
}

async function recordPayment(invoice: Stripe.Invoice, status: PaymentStatus) {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId || !invoice.id) return;

  const dealer = await prisma.dealerProfile.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  if (!dealer) return;

  const line = invoice.lines?.data?.[0] as
    | (Stripe.InvoiceLineItem & {
        price?: { id?: string } | null;
        pricing?: { price_details?: { price?: string } } | null;
      })
    | undefined;
  const priceId = line?.price?.id ?? line?.pricing?.price_details?.price ?? null;
  const tier = tierForPriceId(priceId);

  const amountCents = status === PaymentStatus.PAID ? invoice.amount_paid : invoice.amount_due;
  const amount = new Prisma.Decimal((amountCents ?? 0) / 100);

  const paymentIntent = (invoice as unknown as { payment_intent?: string | { id?: string } })
    .payment_intent;
  const paymentIntentId =
    typeof paymentIntent === "string" ? paymentIntent : (paymentIntent?.id ?? null);

  await prisma.payment.upsert({
    where: { stripeInvoiceId: invoice.id },
    update: { status, amount, tier: tier ?? null },
    create: {
      dealerId: dealer.id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: paymentIntentId,
      amount,
      currency: invoice.currency ?? "sgd",
      status,
      tier,
      description: line?.description ?? "CARSaction subscription",
      periodStart: line?.period?.start ? new Date(line.period.start * 1000) : null,
      periodEnd: line?.period?.end ? new Date(line.period.end * 1000) : null,
    },
  });
}
