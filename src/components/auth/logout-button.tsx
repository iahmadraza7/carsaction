"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { LogOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        void signOut({ callbackUrl: "/" });
      }}
    >
      <LogOutIcon />
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
