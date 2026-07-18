import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PhoneIcon } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Enquiries | Admin" };

export default async function AdminEnquiriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/enquiries");

  const enquiries = await prisma.enquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      listing: { select: { id: true, title: true, dealer: { select: { businessName: true } } } },
    },
  });

  return (
    <AdminShell
      email={session.user.email ?? ""}
      title="Enquiries"
      description={`${enquiries.length} enquir${enquiries.length === 1 ? "y" : "ies"} across all dealers`}
    >
      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">From</th>
              <th className="hidden px-4 py-2 font-medium md:table-cell">Listing / dealer</th>
              <th className="hidden px-4 py-2 font-medium sm:table-cell">Message</th>
              <th className="px-4 py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {enquiries.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5 font-medium">
                    {e.name}
                    {e.buyerId ? <Badge variant="secondary">Buyer</Badge> : null}
                  </div>
                  <a
                    href={`tel:${e.phone}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <PhoneIcon className="size-3" />
                    {e.phone}
                  </a>
                </td>
                <td className="hidden px-4 py-2.5 md:table-cell">
                  <Link href={`/cars/${e.listing.id}`} className="hover:underline">
                    {e.listing.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {e.listing.dealer.businessName}
                  </div>
                </td>
                <td className="hidden max-w-xs px-4 py-2.5 text-muted-foreground sm:table-cell">
                  {e.message ?? "n/a"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{formatDate(e.createdAt)}</td>
              </tr>
            ))}
            {enquiries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No enquiries yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
