import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PhoneIcon, MessageSquareIcon } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DealerShell } from "@/components/dealer/dealer-shell";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { getDealerProfileByUserId } from "@/lib/subscription";

export const metadata: Metadata = { title: "Enquiries | CARSaction" };

export default async function DealerEnquiriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dealer/enquiries");

  const profile = await getDealerProfileByUserId(session.user.id);
  if (!profile) {
    return (
      <DealerShell email={session.user.email ?? ""} title="Enquiries">
        <p className="text-sm text-muted-foreground">Dealer profile not found.</p>
      </DealerShell>
    );
  }

  const enquiries = await prisma.enquiry.findMany({
    where: { listing: { dealerId: profile.id } },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { id: true, title: true } },
      buyer: { select: { name: true } },
    },
  });

  return (
    <DealerShell
      email={session.user.email ?? ""}
      title="Enquiries"
      description={`${enquiries.length} enquir${enquiries.length === 1 ? "y" : "ies"} from buyers`}
    >
      {enquiries.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <h2 className="text-base font-semibold">No enquiries yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            When buyers message you from a listing, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {enquiries.map((e) => (
            <div key={e.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{e.name}</span>
                  {e.buyer ? (
                    <Badge variant="secondary">Registered buyer</Badge>
                  ) : (
                    <Badge variant="outline">Guest</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <a
                  href={`tel:${e.phone}`}
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <PhoneIcon className="size-3.5" />
                  {e.phone}
                </a>
                <Link
                  href={`/cars/${e.listing.id}`}
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <MessageSquareIcon className="size-3.5" />
                  {e.listing.title}
                </Link>
              </div>

              {e.message ? (
                <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">{e.message}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </DealerShell>
  );
}
