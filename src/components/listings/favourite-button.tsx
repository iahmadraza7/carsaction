"use client";

import * as React from "react";
import { HeartIcon } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function FavouriteButton({
  listingId,
  initialFavourited,
}: {
  listingId: string;
  initialFavourited: boolean;
}) {
  const [favourited, setFavourited] = React.useState(initialFavourited);
  const [pending, setPending] = React.useState(false);

  async function toggle() {
    setPending(true);
    const previous = favourited;
    setFavourited(!previous);
    try {
      const res = await fetch("/api/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { favourited: boolean };
      setFavourited(data.favourited);
      toast.success(data.favourited ? "Added to shortlist" : "Removed from shortlist");
    } catch {
      setFavourited(previous);
      toast.error("Could not update shortlist");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size="lg" onClick={toggle} disabled={pending} className="w-full">
      <HeartIcon className={cn(favourited && "fill-primary text-primary")} />
      {favourited ? "On shortlist" : "Add to shortlist"}
    </Button>
  );
}
