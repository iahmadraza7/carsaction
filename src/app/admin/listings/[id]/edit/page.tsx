import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { ListingForm } from "@/components/dealer/listing-form";
import type { ListingFormValues } from "@/lib/validations/listing";

export const metadata: Metadata = { title: "Edit listing — Admin" };

function toDateInput(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function decToString(value: { toString(): string } | null): string {
  return value == null ? "" : value.toString();
}

export default async function AdminEditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/listings");

  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      dealer: { select: { businessName: true } },
    },
  });
  if (!listing) notFound();

  const defaultValues: ListingFormValues = {
    title: listing.title,
    make: listing.make,
    model: listing.model,
    variant: listing.variant ?? "",
    year: String(listing.year),
    price: decToString(listing.price),
    mileage: String(listing.mileage),
    bodyType: listing.bodyType,
    fuelType: listing.fuelType,
    transmission: listing.transmission,
    engineCc: listing.engineCc != null ? String(listing.engineCc) : "",
    colour: listing.colour ?? "",
    regDate: toDateInput(listing.regDate),
    coeExpiry: toDateInput(listing.coeExpiry),
    depreciation: decToString(listing.depreciation),
    omv: decToString(listing.omv),
    arf: decToString(listing.arf),
    description: listing.description ?? "",
  };

  return (
    <AdminShell
      email={session.user.email ?? ""}
      title="Edit listing"
      description={`${listing.title} · ${listing.dealer.businessName}`}
    >
      <ListingForm
        mode="edit"
        listingId={listing.id}
        defaultValues={defaultValues}
        initialImages={listing.images.map((img) => img.url)}
        submitUrl={`/api/admin/listings/${listing.id}`}
        redirectTo="/admin/listings"
      />
    </AdminShell>
  );
}
