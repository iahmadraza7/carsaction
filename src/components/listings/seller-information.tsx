import Link from "next/link";
import { BadgeCheckIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

function waHref(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export type SellerContact = {
  id: string;
  name: string;
  phone: string;
  whatsappEnabled: boolean;
};

export function SellerInformation({
  businessName,
  address,
  mainPhone,
  verified,
  contacts,
  vehicleCount,
  dealerId,
  make,
  model,
  year,
  listingUrl,
}: {
  businessName: string;
  address: string | null;
  mainPhone: string;
  verified: boolean;
  contacts: SellerContact[];
  vehicleCount: number;
  dealerId: string;
  make: string;
  model: string;
  year: number;
  listingUrl: string;
}) {
  const carMessage = `Hi, I'm interested in your ${year} ${make} ${model} listed on CARSaction. Is it still available?\n${listingUrl}`;
  const namedMessage = (name: string) =>
    `Hi ${name}, I'm interested in the ${year} ${make} ${model} listed on CARSaction. Is it still available?\n${listingUrl}`;

  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="font-heading text-lg font-semibold">Seller Information</h2>
        {verified ? (
          <Badge variant="secondary" className="gap-1">
            <BadgeCheckIcon className="size-3.5 text-primary" />
            Verified
          </Badge>
        ) : null}
      </div>

      <p className="text-base font-semibold text-foreground">{businessName}</p>
      {address ? (
        <p className="mt-1 text-sm text-muted-foreground">{address}</p>
      ) : null}

      <div className="mt-4 space-y-3">
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Main phone
            </p>
            <p className="mt-0.5 text-sm font-medium">{mainPhone}</p>
          </div>
          <a
            href={waHref(mainPhone, carMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-sm font-semibold text-white hover:bg-[#1ebe5b]"
          >
            <MessageCircleIcon className="size-4" />
            WhatsApp
          </a>
        </div>

        {contacts.map((c) => (
          <div
            key={c.id}
            className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0"
          >
            <div>
              <p className="text-sm font-semibold">{c.name}</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <PhoneIcon className="size-3.5" />
                {c.phone}
              </p>
            </div>
            {c.whatsappEnabled ? (
              <a
                href={waHref(c.phone, namedMessage(c.name))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-sm font-semibold text-white hover:bg-[#1ebe5b]"
              >
                <MessageCircleIcon className="size-4" />
                WhatsApp
              </a>
            ) : null}
          </div>
        ))}
      </div>

      {vehicleCount > 0 ? (
        <Link
          href={`/cars?dealerId=${dealerId}`}
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          View all {vehicleCount} {vehicleCount === 1 ? "vehicle" : "vehicles"} from this seller
        </Link>
      ) : null}
    </div>
  );
}
