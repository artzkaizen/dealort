import { env } from "@dealort/utils/env";
import { Resend } from "resend";
import { DeleteVerificationEmail } from "./delete-verification";
import { ResetPasswordEmail } from "./reset-password";
import { SecurityWarningEmail } from "./security-warning";
import { VerificationEmail } from "./verification";
import { WelcomeEmail } from "./welcome";
import { InvitationEmail } from "./invitation";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  console.log(`[Email Service] Sending welcome email to: ${to}`);

  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const email = WelcomeEmail({ name });
  const result = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  console.log("[Email Service] Welcome email result:", result);
  return result;
}

export async function sendSecurityWarningEmail({
  to,
  name,
  ipAddress,
  device,
  location,
  timestamp,
}: {
  to: string;
  name: string;
  ipAddress: string;
  device?: string;
  location?: string;
  timestamp: string;
}) {
  const email = SecurityWarningEmail({
    name,
    ipAddress,
    device,
    location,
    timestamp,
  });
  return await resend.emails.send({
    from: env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

export async function sendVerificationEmail({
  to,
  name,
  verificationLink,
}: {
  to: string;
  name: string;
  verificationLink: string;
}) {
  const email = VerificationEmail({ name, verificationLink });
  return await resend.emails.send({
    from: env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

export async function sendDeleteAccountVerificationEmail({
  to,
  name,
  verificationLink,
}: {
  to: string;
  name: string;
  verificationLink: string;
}) {
  const email = DeleteVerificationEmail({ name, verificationLink });
  return await resend.emails.send({
    from: env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

export async function sendResetPasswordEmail({
  to,
  name,
  verificationLink,
}: {
  to: string;
  name: string;
  verificationLink: string;
}) {
  const email = ResetPasswordEmail({ name, verificationLink });
  return await resend.emails.send({
    from: env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

export async function sendInvitationEmail({
  to,
  invitationUrl,
  invitedBy,
  invitationExpiresAt,
  organizationName,
}: {
  to: string;
  invitationUrl: string;
  invitedBy: string;
  invitationExpiresAt: string;
  organizationName: string;
}) {
  console.log(`[Email Service] Sending invitation email to: ${to}`);

  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const email = InvitationEmail({ invitationUrl, organizationName, invitedBy, invitationExpiresAt });
  const result = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  console.log("[Email Service] Invitation email result:", result);
  return result;
}
