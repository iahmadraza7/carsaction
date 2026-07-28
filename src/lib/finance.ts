import { prisma } from "@/lib/prisma";

export async function getFinanceProfileByUserId(userId: string) {
  return prisma.financeProfile.findUnique({
    where: { userId },
  });
}
