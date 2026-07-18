"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { enquirySchema } from "@/lib/validations/enquiry";
import { TextField } from "@/components/auth/text-field";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { z } from "zod";

const formSchema = enquirySchema.omit({ listingId: true });
type FormValues = z.infer<typeof formSchema>;

export function EnquiryForm({
  listingId,
  defaultName = "",
  defaultPhone = "",
}: {
  listingId: string;
  defaultName?: string;
  defaultPhone?: string;
}) {
  const [sent, setSent] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: defaultName, phone: defaultPhone, message: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, listingId }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      reset({ name: defaultName, phone: defaultPhone, message: "" });
      toast.success("Enquiry sent. The dealer will be in touch.");
    } catch {
      toast.error("Could not send your enquiry. Please try again.");
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg bg-primary/10 p-4 text-sm text-foreground">
        Thanks! Your enquiry has been sent to the dealer. They&apos;ll contact you on the
        number you provided.
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-2 block text-primary underline underline-offset-4"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
      <TextField
        label="Your name"
        error={errors.name?.message}
        {...register("name")}
      />
      <TextField
        label="Phone"
        type="tel"
        placeholder="+65 9123 4567"
        error={errors.phone?.message}
        {...register("phone")}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enquiry-message">Message (optional)</Label>
        <textarea
          id="enquiry-message"
          rows={3}
          placeholder="Is this still available? Can I view it this weekend?"
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-invalid={errors.message ? true : undefined}
          {...register("message")}
        />
        {errors.message?.message ? (
          <p className="text-xs font-medium text-destructive">{errors.message.message}</p>
        ) : null}
      </div>
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  );
}
