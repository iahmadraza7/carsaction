import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

type Props =
  | { kind: "dealer_signup" }
  | { kind: "subscription" }
  | { kind: "view_only"; message: string };

export function BidPanelGate(props: Props) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="text-base font-semibold tracking-tight">Place a bid</h2>
      {props.kind === "dealer_signup" ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Only subscribed dealers can bid.
          </p>
          <Link href="/dealer/signup" className={buttonVariants({ size: "sm" })}>
            Register as a dealer
          </Link>
        </div>
      ) : null}
      {props.kind === "subscription" ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            An active subscription is required to bid.
          </p>
          <Link href="/pricing" className={buttonVariants({ size: "sm" })}>
            View dealer plans
          </Link>
        </div>
      ) : null}
      {props.kind === "view_only" ? (
        <p className="mt-3 text-sm text-muted-foreground">{props.message}</p>
      ) : null}
    </div>
  );
}