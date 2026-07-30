import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { DealerShell } from "@/components/dealer/dealer-shell";
import { ContactsManager } from "@/components/dealer/contacts-manager";
import { getDealerProfileByUserId } from "@/lib/subscription";

export const metadata = { title: "Sales contacts | Dealer" };

export default async function DealerContactsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dealer/contacts");
  if (session.user.role !== "DEALER") redirect("/");

  const profile = await getDealerProfileByUserId(session.user.id);
  if (!profile) redirect("/dealer/signup");

  const contacts = await prisma.dealerContact.findMany({
    where: { dealerId: profile.id },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return (
    <DealerShell
      email={session.user.email ?? ""}
      title="Sales contacts"
      description={`Shown on your listing pages under ${profile.businessName}. Your main WhatsApp (${profile.whatsappNumber}) stays as the fallback number.`}
    >
      <ContactsManager initialContacts={contacts} />
    </DealerShell>
  );
}
