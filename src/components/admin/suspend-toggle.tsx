"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setUserSuspended } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function SuspendToggle({
  userId,
  suspended,
  disabled,
}: {
  userId: string;
  suspended: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function toggle() {
    const next = !suspended;
    startTransition(async () => {
      const res = await setUserSuspended({ userId, suspended: next });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(next ? "Account suspended." : "Account reinstated.");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={suspended ? "default" : "outline"}
      disabled={disabled || pending}
      onClick={toggle}
    >
      {suspended ? "Reinstate" : "Suspend"}
    </Button>
  );
}
