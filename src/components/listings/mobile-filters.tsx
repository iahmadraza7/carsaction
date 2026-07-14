"use client";

import * as React from "react";
import { SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filters } from "@/components/listings/filters";

type Props = {
  makes: string[];
  modelsByMake: Record<string, string[]>;
  activeCount: number;
};

export function MobileFilters({ makes, modelsByMake, activeCount }: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm">
            <SlidersHorizontalIcon />
            Filters
            {activeCount > 0 ? (
              <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {activeCount}
              </span>
            ) : null}
          </Button>
        }
      />
      <SheetContent side="left" className="w-[86%] max-w-sm gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto p-4">
          <Filters
            makes={makes}
            modelsByMake={modelsByMake}
            onApplied={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
