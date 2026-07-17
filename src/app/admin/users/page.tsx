import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SearchIcon } from "lucide-react";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { RoleSelect } from "@/components/admin/role-select";
import { SuspendToggle } from "@/components/admin/suspend-toggle";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Users — Admin" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/users");

  const { q } = await searchParams;
  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { dealerProfile: { select: { businessName: true, verified: true } } },
  });

  return (
    <AdminShell
      email={session.user.email ?? ""}
      title="Users"
      description={`${users.length} user${users.length === 1 ? "" : "s"}`}
    >
      <form method="get" className="mb-5 flex max-w-md items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name or email…"
            className="h-9 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="hidden px-4 py-2 font-medium sm:table-cell">Joined</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className={u.suspended ? "bg-muted/30" : undefined}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2 font-medium">
                    {u.name ?? "—"}
                    {u.suspended ? <Badge variant="destructive">Suspended</Badge> : null}
                  </div>
                  {u.dealerProfile ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {u.dealerProfile.businessName}
                      {u.dealerProfile.verified ? (
                        <Badge variant="secondary">Verified</Badge>
                      ) : null}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">
                  {formatDate(u.createdAt)}
                </td>
                <td className="px-4 py-2.5">
                  <RoleSelect
                    userId={u.id}
                    role={u.role}
                    disabled={u.id === session.user.id || u.suspended}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <SuspendToggle
                    userId={u.id}
                    suspended={u.suspended}
                    disabled={u.id === session.user.id}
                  />
                </td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No users match your search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
