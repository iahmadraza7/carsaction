"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PencilIcon, Trash2Icon, TagIcon, RotateCcwIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const controlClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type SaleFormValues = {
  salePrice: string;
  buyerName: string;
  buyerPhone: string;
  notes: string;
};

export function ListingActions({
  listingId,
  isSold,
  defaultPrice,
}: {
  listingId: string;
  isSold: boolean;
  defaultPrice: string;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [soldOpen, setSoldOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SaleFormValues>({
    defaultValues: { salePrice: defaultPrice, buyerName: "", buyerPhone: "", notes: "" },
  });

  async function onDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/dealer/listings/${listingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Listing deleted.");
      setDeleteOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not delete the listing.");
    } finally {
      setBusy(false);
    }
  }

  async function onRelist() {
    setBusy(true);
    try {
      const res = await fetch(`/api/dealer/listings/${listingId}/sold`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Listing is back on sale.");
      router.refresh();
    } catch {
      toast.error("Could not relist the car.");
    } finally {
      setBusy(false);
    }
  }

  async function onMarkSold(values: SaleFormValues) {
    const res = await fetch(`/api/dealer/listings/${listingId}/sold`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (data?.errors) {
        for (const [field, messages] of Object.entries(
          data.errors as Record<string, string[]>,
        )) {
          setError(field as keyof SaleFormValues, { message: messages?.[0] });
        }
      } else {
        toast.error(data?.error ?? "Could not mark as sold.");
      }
      return;
    }
    toast.success("Marked as sold.");
    setSoldOpen(false);
    reset({ salePrice: defaultPrice, buyerName: "", buyerPhone: "", notes: "" });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        href={`/dealer/listings/${listingId}/edit`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <PencilIcon />
        Edit
      </Link>

      {isSold ? (
        <Button variant="outline" size="sm" onClick={onRelist} disabled={busy}>
          <RotateCcwIcon />
          Relist
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setSoldOpen(true)}>
          <TagIcon />
          Mark sold
        </Button>
      )}

      <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
        <Trash2Icon />
        Delete
      </Button>

      {/* Delete confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this listing?</DialogTitle>
            <DialogDescription>
              This permanently removes the listing, its photos and enquiries. This can&apos;t be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={busy}>
              {busy ? "Deleting…" : "Delete listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark sold */}
      <Dialog open={soldOpen} onOpenChange={setSoldOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit(onMarkSold)} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Mark as sold</DialogTitle>
              <DialogDescription>
                Records the sale and hides the car from buyers. You can relist later.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Sale price (S$)</Label>
              <input
                className={controlClass}
                type="number"
                inputMode="numeric"
                {...register("salePrice")}
              />
              {errors.salePrice?.message ? (
                <p className="text-xs font-medium text-destructive">{errors.salePrice.message}</p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Buyer name (optional)
              </Label>
              <input className={controlClass} {...register("buyerName")} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Buyer phone (optional)
              </Label>
              <input className={controlClass} {...register("buyerPhone")} />
              {errors.buyerPhone?.message ? (
                <p className="text-xs font-medium text-destructive">{errors.buyerPhone.message}</p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Notes (optional)</Label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                {...register("notes")}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSoldOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Confirm sold"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
