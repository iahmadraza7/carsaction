import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFinanceProfileByUserId } from "@/lib/finance";
import { FinanceShell } from "@/components/finance/finance-shell";
import { RepoVehicleForm } from "@/components/finance/repo-vehicle-form";
import { buttonVariants } from "@/components/ui/button";
import {
  toDateInputValue,
  toDatetimeLocalValue,
  type RepoVehicleFormValues,
} from "@/lib/validations/repo-vehicle";

export const metadata: Metadata = { title: "Edit repo vehicle | CARSaction" };

type Props = { params: Promise<{ id: string }> };

export default async function EditRepoVehiclePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/finance/dashboard");

  const profile = await getFinanceProfileByUserId(session.user.id);
  if (!profile) redirect("/finance/dashboard");

  const { id } = await params;
  const vehicle = await prisma.repoVehicle.findFirst({
    where: { id, financeCoId: profile.id },
    include: {
      images: { orderBy: { order: "asc" } },
      _count: { select: { bids: true } },
    },
  });
  if (!vehicle) notFound();

  const canEdit = vehicle.status === "OPEN" && vehicle._count.bids === 0;
  if (!canEdit) {
    return (
      <FinanceShell
        email={session.user.email ?? ""}
        title="Edit repo vehicle"
        description="Editing is locked"
      >
        <p className="text-sm text-muted-foreground">
          This vehicle can only be edited while the auction is open and before any bids are
          placed.
        </p>
        <Link
          href="/finance/dashboard"
          className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}
        >
          Back to dashboard
        </Link>
      </FinanceShell>
    );
  }

  // CONFIDENTIAL: reserve price — finance owner / admin only
  const defaultValues: RepoVehicleFormValues = {
    make: vehicle.make,
    model: vehicle.model,
    year: String(vehicle.year),
    mileage: String(vehicle.mileage),
    bodyType: vehicle.bodyType,
    colour: vehicle.colour ?? "",
    regDate: toDateInputValue(vehicle.regDate),
    coeExpiry: toDateInputValue(vehicle.coeExpiry),
    condition: vehicle.condition ?? "",
    location: vehicle.location ?? "",
    description: vehicle.description ?? "",
    reservePrice: vehicle.reservePrice != null ? String(Number(vehicle.reservePrice)) : "",
    biddingOpensAt: toDatetimeLocalValue(vehicle.biddingOpensAt),
    biddingClosesAt: toDatetimeLocalValue(vehicle.biddingClosesAt),
  };

  return (
    <FinanceShell
      email={session.user.email ?? ""}
      title="Edit repo vehicle"
      description={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
    >
      <RepoVehicleForm
        mode="edit"
        vehicleId={vehicle.id}
        defaultValues={defaultValues}
        initialImages={vehicle.images.map((img) => img.url)}
      />
    </FinanceShell>
  );
}
