"use client";

import * as React from "react";
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ContactRow = {
  id: string;
  name: string;
  phone: string;
  whatsappEnabled: boolean;
  order: number;
};

const controlClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ContactsManager({ initialContacts }: { initialContacts: ContactRow[] }) {
  const [contacts, setContacts] = React.useState(initialContacts);
  const [pending, setPending] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    whatsappEnabled: true,
  });

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", phone: "", whatsappEnabled: true });
  }

  function startEdit(c: ContactRow) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      phone: c.phone,
      whatsappEnabled: c.whatsappEnabled,
    });
  }

  async function save() {
    setPending(true);
    try {
      const url = editingId ? `/api/dealer/contacts/${editingId}` : "/api/dealer/contacts";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as {
        contact?: ContactRow;
        error?: string;
        errors?: Record<string, string[]>;
      };
      if (!res.ok) {
        const first =
          data.error ??
          Object.values(data.errors ?? {})
            .flat()
            .find(Boolean) ??
          "Could not save contact";
        throw new Error(first);
      }
      if (!data.contact) throw new Error("Could not save contact");
      setContacts((prev) => {
        if (editingId) {
          return prev.map((c) => (c.id === editingId ? data.contact! : c));
        }
        return [...prev, data.contact!];
      });
      toast.success(editingId ? "Contact updated" : "Contact added");
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save contact");
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this sales contact?")) return;
    setPending(true);
    try {
      const res = await fetch(`/api/dealer/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (editingId === id) resetForm();
      toast.success("Contact removed");
    } catch {
      toast.error("Could not remove contact");
    } finally {
      setPending(false);
    }
  }

  async function move(id: string, direction: -1 | 1) {
    const idx = contacts.findIndex((c) => c.id === id);
    const next = idx + direction;
    if (idx < 0 || next < 0 || next >= contacts.length) return;

    const reordered = [...contacts];
    const [item] = reordered.splice(idx, 1);
    reordered.splice(next, 0, item);
    setContacts(reordered);

    setPending(true);
    try {
      const res = await fetch("/api/dealer/contacts/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((c) => c.id) }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setContacts(contacts);
      toast.error("Could not reorder contacts");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="mb-4 text-sm font-semibold">
          {editingId ? "Edit contact" : "Add sales contact"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Name</span>
            <input
              className={controlClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Alex Tan"
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Phone</span>
            <input
              className={controlClass}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+65 9123 4567"
            />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.whatsappEnabled}
            onChange={(e) => setForm((f) => ({ ...f, whatsappEnabled: e.target.checked }))}
          />
          Show WhatsApp button for this contact
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={save} disabled={pending}>
            {editingId ? (
              <>
                <PencilIcon />
                Save changes
              </>
            ) : (
              <>
                <PlusIcon />
                Add contact
              </>
            )}
          </Button>
          {editingId ? (
            <Button variant="outline" onClick={resetForm} disabled={pending}>
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl bg-card ring-1 ring-foreground/10">
        {contacts.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No sales contacts yet. Add people who should appear on your listing pages.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {contacts.map((c, i) => (
              <li
                key={c.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 px-5 py-4",
                  editingId === c.id && "bg-muted/40",
                )}
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.phone}
                    {c.whatsappEnabled ? " · WhatsApp on" : " · phone only"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending || i === 0}
                    onClick={() => move(c.id, -1)}
                    aria-label="Move up"
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending || i === contacts.length - 1}
                    onClick={() => move(c.id, 1)}
                    aria-label="Move down"
                  >
                    <ArrowDownIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending}
                    onClick={() => startEdit(c)}
                    aria-label="Edit"
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending}
                    onClick={() => remove(c.id)}
                    aria-label="Remove"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
