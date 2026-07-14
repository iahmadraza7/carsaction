import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardShell({
  label,
  name,
  email,
  role,
}: {
  label: string;
  name: string;
  email: string;
  role: string;
}) {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground">
              C
            </span>
            CARS<span className="-ml-1 text-primary">action</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-1">
          <span className="inline-flex w-fit items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
            {label}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome, {name}</h1>
        </div>

        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Your session</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row k="Name" v={name} />
            <Row k="Email" v={email} />
            <Row k="Role" v={role} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
