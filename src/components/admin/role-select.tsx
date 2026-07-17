"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Role } from "@prisma/client";

import { setUserRole } from "@/app/admin/actions";

const controlClass =
  "h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

const ROLES: Role[] = [Role.BUYER, Role.DEALER, Role.ADMIN, Role.FINANCE_CO];

export function RoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: Role;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [value, setValue] = React.useState<Role>(role);

  function onChange(next: Role) {
    const prev = value;
    setValue(next);
    startTransition(async () => {
      const res = await setUserRole({ userId, role: next });
      if (!res.ok) {
        setValue(prev);
        toast.error(res.error);
        return;
      }
      toast.success("Role updated.");
      router.refresh();
    });
  }

  return (
    <select
      className={controlClass}
      value={value}
      disabled={disabled || pending}
      onChange={(e) => onChange(e.target.value as Role)}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
