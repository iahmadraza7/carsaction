import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

// Resend's shared sandbox sender works without domain verification in dev.
const FROM = process.env.EMAIL_FROM || "CARSaction <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  // In dev without a Resend key, log the link so the flow stays testable.
  if (!resend) {
    console.log(`[dev] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your CARSaction password",
    html: `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1f1b16;">Reset your password</h2>
        <p style="color: #4a4139;">
          We received a request to reset your CARSaction password. Click the button below to
          choose a new one. This link expires in 1 hour.
        </p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}"
             style="background: #c25b1c; color: #fff; padding: 12px 20px; border-radius: 8px;
                    text-decoration: none; font-weight: 600;">
            Reset password
          </a>
        </p>
        <p style="color: #8a7f74; font-size: 13px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendAuctionWonEmail(input: {
  to: string;
  dealerName: string;
  vehicleTitle: string;
  companyName: string;
  contactPerson: string | null;
  contactEmail: string;
  contactPhone: string | null;
  auctionUrl: string;
}): Promise<void> {
  const contactLines = [
    input.companyName,
    input.contactPerson ? `Contact: ${input.contactPerson}` : null,
    `Email: ${input.contactEmail}`,
    input.contactPhone ? `Phone: ${input.contactPhone}` : null,
  ]
    .filter(Boolean)
    .join("<br/>");

  if (!resend) {
    console.log(
      `[dev] Auction won email for ${input.to}: You won ${input.vehicleTitle}. Contact ${input.companyName} <${input.contactEmail}>. ${input.auctionUrl}`,
    );
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: `You won the bid for ${input.vehicleTitle}`,
    html: `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1f1b16;">Congratulations, ${input.dealerName}</h2>
        <p style="color: #4a4139;">
          You won the bid for <strong>${input.vehicleTitle}</strong> on CARSaction.
          Please contact the finance company to complete the deal:
        </p>
        <p style="color: #1f1b16; line-height: 1.6;">${contactLines}</p>
        <p style="margin: 24px 0;">
          <a href="${input.auctionUrl}"
             style="background: #c25b1c; color: #fff; padding: 12px 20px; border-radius: 8px;
                    text-decoration: none; font-weight: 600;">
            View auction
          </a>
        </p>
      </div>
    `,
  });
}
