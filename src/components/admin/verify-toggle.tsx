"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BadgeCheckIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setDealerVerified } from "@/app/admin/actions";

export function VerifyToggle({
  dealerId,
  verified,
}: {
  dealerId: string;
  verified: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function toggle() {
    startTransition(async () => {
      const res = await setDealerVerified({ dealerId, verified: !verified });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(verified ? "Verification removed." : "Dealer verified.");
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
