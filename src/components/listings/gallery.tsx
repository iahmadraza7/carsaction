"use client";

import * as React from "react";
import Image from "next/image";
import { ImageOffIcon, ExpandIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <ImageOffIcon className="size-10" />
      </div>
    );
  }

  const activeSrc = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10"
        aria-label="Enlarge photo"
      >
        <Image
          src={activeSrc}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 640px"
          className="object-cover"
        />
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          <ExpandIcon className="size-3.5" />
          Enlarge
        </span>
      </button>

      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg bg-muted ring-1 transition-all",
                i === active
                  ? "ring-2 ring-primary"
                  : "ring-foreground/10 hover:ring-foreground/25",
              )}
            >
              <Image
                src={src}
                alt={`${title} photo ${i + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-1rem)] p-2 sm:max-w-3xl">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={activeSrc}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
