import { MessageCircleIcon } from "lucide-react";

function buildWhatsappHref(opts: {
  phone: string;
  make: string;
  model: string;
  year: number;
  listingUrl: string;
}) {
  const digits = opts.phone.replace(/\D/g, "");
  const message = `Hi, I'm interested in your ${opts.year} ${opts.make} ${opts.model} listed on CARSaction. Is it still available?\n${opts.listingUrl}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function WhatsAppButton(props: {
  phone: string;
  make: string;
  model: string;
  year: number;
  listingUrl: string;
}) {
  const href = buildWhatsappHref(props);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#1ebe5b] focus-visible:ring-3 focus-visible:ring-[#25D366]/40 focus-visible:outline-none"
    >
      <MessageCircleIcon className="size-5" />
      WhatsApp the dealer
    </a>
  );
}
