"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeftIcon, ArrowRightIcon, ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSIONS,
  humanizeEnum,
} from "@/lib/listing-options";
import {
  listingSchema,
  type ListingFormValues,
  emptyListingForm,
} from "@/lib/validations/listing";

const controlClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

type Props = {
  mode: "create" | "edit";
  listingId?: string;
  defaultValues?: ListingFormValues;
  initialImages?: string[];
  /** Override save endpoint (e.g. admin edit). */
  submitUrl?: string;
  /** Where to go after a successful save. */
  redirectTo?: string;
  /** Override photo upload endpoint. Defaults to dealer uploads. */
  uploadUrl?: string;
};

export function ListingForm({
  mode,
  listingId,
  defaultValues,
  initialImages = [],
  submitUrl,
  redirectTo,
  uploadUrl = "/api/dealer/uploads",
}: Props) {
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [images, setImages] = React.useState<string[]>(initialImages);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormValues>({
    defaultValues: defaultValues ?? emptyListingForm,
  });

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setImageError(null);
    setUploading(true);
    try {
      const body = new FormData();
      Array.from(files).forEach((f) => body.append("files", f));
      const res = await fetch(uploadUrl, { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setImageError(data?.error ?? "Upload failed. Please try again.");
        return;
      }
      setImages((prev) => [...prev, ...(data.urls as string[])].slice(0, 15));
    } catch {
      setImageError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function move(index: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(values: ListingFormValues) {
    const parsed = listingSchema.safeParse({ ...values, images });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      for (const [field, messages] of Object.entries(fieldErrors)) {
        if (field === "images") {
          setImageError(messages?.[0] ?? "Add at least one photo");
        } else {
          setError(field as keyof ListingFormValues, { message: messages?.[0] });
        }
      }
      return;
    }

    const url =
      submitUrl ??
      (mode === "create" ? "/api/dealer/listings" : `/api/dealer/listings/${listingId}`);
    const method = mode === "create" && !submitUrl ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, images }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (data?.errors) {
        for (const [field, messages] of Object.entries(
          data.errors as Record<string, string[]>,
        )) {
          if (field === "images") setImageError(messages?.[0] ?? null);
          else setError(field as keyof ListingFormValues, { message: messages?.[0] });
        }
      } else {
        toast.error(data?.error ?? "Could not save the listing. Please try again.");
      }
      return;
    }

    toast.success(mode === "create" ? "Listing published." : "Listing updated.");
    router.push(redirectTo ?? "/dealer/listings");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8" noValidate>
      {/* Photos */}
      <Section title="Photos" hint="The first photo is the cover. Add up to 15.">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((url, i) => (
              <div
                key={url}
                className="group relative aspect-[16/10] overflow-hidden rounded-lg border bg-muted"
              >
                <Image src={url} alt="" fill sizes="200px" className="object-cover" />
                {i === 0 ? (
                  <span className="absolute top-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    Cover
                  </span>
                ) : null}
                <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1">
                  <div className="flex gap-1">
                    <IconBtn label="Move left" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowLeftIcon />
                    </IconBtn>
                    <IconBtn
                      label="Move right"
                      disabled={i === images.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowRightIcon />
                    </IconBtn>
                  </div>
                  <IconBtn label="Remove" onClick={() => removeImage(i)}>
                    <XIcon />
                  </IconBtn>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-fit"
        >
          {uploading ? <Loader2Icon className="animate-spin" /> : <ImagePlusIcon />}
          {uploading ? "Uploading…" : "Add photos"}
        </Button>
        {imageError ? <FieldError message={imageError} /> : null}
      </Section>

      {/* Basics */}
      <Section title="Vehicle basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="sm:col-span-2" label="Listing title" error={errors.title?.message}>
            <input
              className={controlClass}
              placeholder="2019 Toyota Corolla Altis 1.6 Elegance"
              aria-invalid={errors.title ? true : undefined}
              {...register("title")}
            />
          </Field>
          <Field label="Make" error={errors.make?.message}>
            <input className={controlClass} placeholder="Toyota" {...register("make")} />
          </Field>
          <Field label="Model" error={errors.model?.message}>
            <input className={controlClass} placeholder="Corolla Altis" {...register("model")} />
          </Field>
          <Field label="Variant (optional)" error={errors.variant?.message}>
            <input className={controlClass} placeholder="1.6 Elegance" {...register("variant")} />
          </Field>
          <Field label="Colour (optional)" error={errors.colour?.message}>
            <input className={controlClass} placeholder="Silver" {...register("colour")} />
          </Field>
          <Field label="Registration year" error={errors.year?.message}>
            <input
              className={controlClass}
              type="number"
              inputMode="numeric"
              placeholder="2019"
              {...register("year")}
            />
          </Field>
          <Field label="Price (S$)" error={errors.price?.message}>
            <input
              className={controlClass}
              type="number"
              inputMode="numeric"
              placeholder="78800"
              {...register("price")}
            />
          </Field>
          <Field label="Mileage (km)" error={errors.mileage?.message}>
            <input
              className={controlClass}
              type="number"
              inputMode="numeric"
              placeholder="68000"
              {...register("mileage")}
            />
          </Field>
          <Field label="Engine (cc, optional)" error={errors.engineCc?.message}>
            <input
              className={controlClass}
              type="number"
              inputMode="numeric"
              placeholder="1598"
              {...register("engineCc")}
            />
          </Field>
        </div>
      </Section>

      {/* Specs */}
      <Section title="Specifications">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Body type" error={errors.bodyType?.message}>
            <select className={controlClass} defaultValue="" {...register("bodyType")}>
              <option value="" disabled>
                Select…
              </option>
              {BODY_TYPES.map((b) => (
                <option key={b} value={b}>
                  {humanizeEnum(b)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fuel type" error={errors.fuelType?.message}>
            <select className={controlClass} defaultValue="" {...register("fuelType")}>
              <option value="" disabled>
                Select…
              </option>
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {humanizeEnum(f)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Transmission" error={errors.transmission?.message}>
            <select className={controlClass} defaultValue="" {...register("transmission")}>
              <option value="" disabled>
                Select…
              </option>
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>
                  {humanizeEnum(t)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* SG specifics */}
      <Section
        title="Singapore details"
        hint="COE expiry, depreciation, OMV and ARF are expected on every SG listing."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Registration date" error={errors.regDate?.message}>
            <input className={controlClass} type="date" {...register("regDate")} />
          </Field>
          <Field label="COE expiry" error={errors.coeExpiry?.message}>
            <input className={controlClass} type="date" {...register("coeExpiry")} />
          </Field>
          <Field label="Depreciation (S$/yr)" error={errors.depreciation?.message}>
            <input
              className={controlClass}
              type="number"
              inputMode="numeric"
              placeholder="11200"
              {...register("depreciation")}
            />
          </Field>
          <Field label="OMV (S$)" error={errors.omv?.message}>
            <input
              className={controlClass}
              type="number"
              inputMode="numeric"
              placeholder="21000"
              {...register("omv")}
            />
          </Field>
          <Field label="ARF (S$)" error={errors.arf?.message}>
            <input
              className={controlClass}
              type="number"
              inputMode="numeric"
              placeholder="18500"
              {...register("arf")}
            />
          </Field>
        </div>
      </Section>

      {/* Description */}
      <Section title="Description">
        <textarea
          rows={5}
          placeholder="Well maintained, full service history, one careful owner…"
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          {...register("description")}
        />
        {errors.description?.message ? <FieldError message={errors.description.message} /> : null}
      </Section>

      <div className="flex items-center gap-2 border-t pt-6">
        <Button type="submit" size="lg" disabled={isSubmitting || uploading}>
          {isSubmitting
            ? "Saving…"
            : mode === "create"
              ? "Publish listing"
              : "Save changes"}
        </Button>
        <Link
          href="/dealer/listings"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error ? <FieldError message={error} /> : null}
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-6 items-center justify-center rounded-md bg-background/90 text-foreground shadow-sm ring-1 ring-border transition hover:bg-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}
