"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BadgeCheckIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setFinanceVerified } from "@/app/admin/actions";

export function FinanceVerifyToggle({
  financeId,
  verified,
}: {
  financeId: string;
  verified: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function toggle() {
    startTransition(async () => {
      const res = await setFinanceVerified({ financeId, verified: !verified });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(verified ? "Verification removed." : "Finance company verified.");
      router.refresh();
    });
  }

  return (
    <Button
      variant={verified ? "outline" : "default"}
      size="sm"
      onClick={toggle}
      disabled={pending}
    >
      {verified ? <XIcon /> : <BadgeCheckIcon />}
      {verified ? "Unverify" : "Verify"}
    </Button>
  );
}
