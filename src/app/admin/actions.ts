"use server";

import { revalidatePath } from "next/cache";
import { Role, Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export type ActionResult = { ok: true } | { ok: false; error: string };

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(Role),
});

export async function setUserRole(input: z.infer<typeof roleSchema>): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  // Guard: an admin can't demote themselves out of the admin role (avoids
  // locking everyone out of the panel by accident).
  if (parsed.data.userId === session.user.id && parsed.data.role !== Role.ADMIN) {
    return { ok: false, error: "You can't change your own admin role." };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

const suspendSchema = z.object({
  userId: z.string().min(1),
  suspended: z.boolean(),
});

export async function setUserSuspended(
  input: z.infer<typeof suspendSchema>,
): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = suspendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  if (parsed.data.userId === session.user.id) {
    return { ok: false, error: "You can't suspend your own account." };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { suspended: parsed.data.suspended },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

const verifySchema = z.object({
  dealerId: z.string().min(1),
  verified: z.boolean(),
});

export async function setDealerVerified(
  input: z.infer<typeof verifySchema>,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  await prisma.dealerProfile.update({
    where: { id: parsed.data.dealerId },
    data: { verified: parsed.data.verified },
  });
  revalidatePath("/admin/dealers");
  return { ok: true };
}

export async function deleteListingAsAdmin(listingId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!listingId) return { ok: false, error: "Invalid input" };
  await prisma.listing.delete({ where: { id: listingId } });
  revalidatePath("/admin/listings");
  return { ok: true };
}

const planSchema = z.object({
  planId: z.string().min(1),
  name: z.string().trim().min(2).max(50),
  monthlyPrice: z.coerce.number().nonnegative().max(99_999),
  listingLimit: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.number().int().positive().max(100_000).nullable(),
  ),
  active: z.boolean(),
});

export async function updatePlan(input: z.infer<typeof planSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the plan fields and try again." };

  const { planId, name, monthlyPrice, listingLimit, active } = parsed.data;
  await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: {
      name,
      monthlyPrice: new Prisma.Decimal(monthlyPrice),
      listingLimit,
      active,
    },
  });
  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  return { ok: true };
}
