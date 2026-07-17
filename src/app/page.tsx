import Link from "next/link";
import type { Metadata } from "next";
import {
  ShieldCheckIcon,
  ReceiptTextIcon,
  BadgeCheckIcon,
  SearchIcon,
  MessageCircleIcon,
  HandshakeIcon,
  GavelIcon,
  ArrowRightIcon,
  CheckIcon,
} from "lucide-react";
import { ListingStatus, SubStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { ListingCard, type ListingCardData } from "@/components/listings/listing-card";
import { Reveal } from "@/components/motion/reveal";
import { ScrollHero } from "@/components/motion/scroll-hero";
import { AnimatedCounter } from "@/components/animated-counter";
import { buttonVariants } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "CARSaction — Singapore's transparent car marketplace",
  description:
    "Buy and sell cars in Singapore the transparent way. Every listing shows COE expiry, depreciation, OMV and ARF. Flat monthly dealer subscriptions, no per-car fees.",
  openGraph: {
    title: "CARSaction — Singapore's transparent car marketplace",
    description:
      "Every listing shows COE, depreciation, OMV and ARF. Flat dealer subscriptions, no per-car fees.",
  },
};

function hero(id: string): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=2000&q=80`;
}

const HERO_IMAGES = [
  hero("1503376780353-7e6692767b70"),
  hero("1519641471654-76ce0107ad1b"),
  hero("1580273916550-e323be2ae537"),
];

function dashboardHref(role?: string) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "DEALER") return "/dealer/dashboard";
  if (role === "FINANCE_CO") return "/finance/dashboard";
  return null;
}

export default async function Home() {
  const session = await auth();
  const user = session?.user;
  const dash = dashboardHref(user?.role);

  const [featuredRaw, liveCount, dealerCount, plans] = await Promise.all([
    prisma.listing.findMany({
      where: { status: ListingStatus.FOR_SALE },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
    }),
    prisma.listing.count({ where: { status: ListingStatus.FOR_SALE } }),
    prisma.dealerProfile.count({ where: { subscriptionStatus: SubStatus.ACTIVE } }),
    prisma.subscriptionPlan.findMany({ where: { active: true }, orderBy: { monthlyPrice: "asc" } }),
  ]);

  const featured: ListingCardData[] = featuredRaw.map((l) => ({
    id: l.id,
    title: l.title,
    price: Number(l.price),
    depreciation: l.depreciation != null ? Number(l.depreciation) : null,
    year: l.year,
    mileage: l.mileage,
    transmission: l.transmission,
    fuelType: l.fuelType,
    imageUrl: l.images[0]?.url ?? null,
  }));

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />

      {/* Scroll-driven hero */}
      <ScrollHero images={HERO_IMAGES}>
        <div className="max-w-3xl">
          <span className="mb-5 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            Singapore car marketplace
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-balance text-white sm:text-6xl">
            Buy and sell cars in Singapore, the transparent way.
          </h1>
          <p className="mt-5 max-w-xl text-base text-pretty text-white/80 sm:text-lg">
            Flat monthly dealer subscriptions instead of per-car fees. Every listing shows COE
            expiry, depreciation, OMV and ARF — the numbers Singapore buyers actually compare.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cars"
              className={buttonVariants({ size: "lg", className: "shadow-lg" })}
            >
              Browse cars
              <ArrowRightIcon />
            </Link>
            {user ? (
              dash ? (
                <Link
                  href={dash}
                  className={buttonVariants({
                    size: "lg",
                    variant: "outline",
                    className: "border-white/30 bg-white/10 text-white hover:bg-white/20",
                  })}
                >
                  Go to your dashboard
                </Link>
              ) : null
            ) : (
              <Link
                href="/dealer/signup"
                className={buttonVariants({
                  size: "lg",
                  variant: "outline",
                  className: "border-white/30 bg-white/10 text-white hover:bg-white/20",
                })}
              >
                Register your dealership
              </Link>
            )}
          </div>
        </div>
      </ScrollHero>

      {/* Stats band */}
      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-4 px-4 py-10 text-center">
          <Stat value={<AnimatedCounter value={liveCount} />} label="Cars listed" />
          <Stat value={<AnimatedCounter value={dealerCount} />} label="Active dealers" />
          <Stat value={<>4</>} label="SG figures on every car" sub="COE · Depr · OMV · ARF" />
        </div>
      </section>

      {/* Why CARSaction */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for how Singapore actually buys cars
          </h2>
          <p className="mt-3 text-muted-foreground">
            No hidden per-listing fees, no missing numbers, no guesswork.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <Reveal delay={0}>
            <Feature
              icon={<ReceiptTextIcon />}
              title="Every number, up front"
              body="COE expiry, depreciation per year, OMV and ARF on every listing — the figures that decide a deal in Singapore."
            />
          </Reveal>
          <Reveal delay={0.1}>
            <Feature
              icon={<ShieldCheckIcon />}
              title="Flat dealer subscriptions"
              body="Dealers pay one predictable monthly fee, not per car. More inventory, no penalty for listing it."
            />
          </Reveal>
          <Reveal delay={0.2}>
            <Feature
              icon={<BadgeCheckIcon />}
              title="Verified dealers"
              body="Verified badges on trusted dealerships, so buyers know exactly who they're talking to."
            />
          </Reveal>
        </div>
      </section>

      {/* Featured listings */}
      {featured.length > 0 ? (
        <section className="bg-secondary/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-20">
            <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Fresh on the market</h2>
                <p className="mt-2 text-muted-foreground">Hand-picked cars listed by our dealers.</p>
              </div>
              <Link
                href="/cars"
                className={buttonVariants({ variant: "outline" })}
              >
                Browse all cars
                <ArrowRightIcon />
              </Link>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((listing, i) => (
                <Reveal key={listing.id} delay={(i % 3) * 0.08}>
                  <ListingCard listing={listing} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">From browsing to a handshake, in three steps.</p>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: <SearchIcon />,
              title: "Browse & filter",
              body: "Search by make, price, year, mileage and body type. Compare the SG numbers side by side.",
            },
            {
              icon: <MessageCircleIcon />,
              title: "Message the dealer",
              body: "WhatsApp the dealer directly from any listing, or send an enquiry — no account needed.",
            },
            {
              icon: <HandshakeIcon />,
              title: "Close the deal",
              body: "Meet, inspect and buy with confidence from verified Singapore dealerships.",
            },
          ].map((step, i) => (
            <Reveal key={step.title} delay={i * 0.1}>
              <div className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:size-4.5">
                    {step.icon}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      {plans.length > 0 ? (
        <section className="bg-secondary/40">
          <div className="mx-auto w-full max-w-6xl px-4 py-20">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Simple pricing for dealers
              </h2>
              <p className="mt-3 text-muted-foreground">
                One flat monthly fee. List your whole lot, not one car at a time.
              </p>
            </Reveal>
            <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
              {plans.map((plan, i) => (
                <Reveal key={plan.id} delay={i * 0.1}>
                  <div
                    className={`flex h-full flex-col gap-4 rounded-2xl border bg-card p-6 ${
                      plan.tier === "PLATINUM" ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      {plan.tier === "PLATINUM" ? (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          Most popular
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {formatPrice(Number(plan.monthlyPrice))}
                      </span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                    <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckIcon className="size-4 text-primary" />
                        {plan.listingLimit == null
                          ? "Unlimited active listings"
                          : `Up to ${plan.listingLimit} active listings`}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckIcon className="size-4 text-primary" />
                        WhatsApp enquiries & inbox
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckIcon className="size-4 text-primary" />
                        Verified dealer badge
                      </li>
                    </ul>
                    <Link
                      href="/pricing"
                      className={buttonVariants({
                        variant: plan.tier === "PLATINUM" ? "default" : "outline",
                        className: "mt-auto",
                      })}
                    >
                      See plan details
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Repo bidding teaser (Milestone 2) */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border bg-foreground px-6 py-14 text-center text-background sm:px-12">
            <div className="mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-1 text-xs font-medium">
                <GavelIcon className="size-3.5" />
                Coming soon
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Repossessed vehicle bidding
              </h2>
              <p className="mt-3 text-background/70">
                Finance companies will list repossessed vehicles and dealers will bid — a
                transparent, deadline-based process. Launching in our next milestone.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="border-t bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center">
          <Reveal>
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Ready to find your next car — or sell your lot?
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/cars" className={buttonVariants({ size: "lg" })}>
                Browse cars
              </Link>
              <Link
                href="/dealer/signup"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Register your dealership
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark />
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link href="/cars" className="hover:text-foreground hover:underline">
              Browse cars
            </Link>
            <Link href="/pricing" className="hover:text-foreground hover:underline">
              Pricing
            </Link>
            <Link href="/dealer/signup" className="hover:text-foreground hover:underline">
              List with us
            </Link>
            <Link href="/login" className="hover:text-foreground hover:underline">
              Sign in
            </Link>
          </nav>
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CARSaction
          </span>
        </div>
      </footer>
    </div>
  );
}

function Stat({
  value,
  label,
  sub,
}: {
  value: React.ReactNode;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">{value}</span>
      <span className="mt-1 text-sm font-medium">{label}</span>
      {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-6">
      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:size-5">
        {icon}
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
