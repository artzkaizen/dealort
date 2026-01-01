import {
  DeleteVerificationEmail,
  InvitationEmail,
  ResetPasswordEmail,
  SecurityWarningEmail,
  VerificationEmail,
  WaitlistConfirmationEmail,
  WelcomeEmail,
} from "@dealort/emails";
import { env } from "@dealort/utils/env";
import { emailLogger } from "@dealort/utils/logger";
import { Resend } from "resend";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  emailLogger.info({ to, name }, "Sending welcome email");

  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const dashboardUrl = `${env.CORS_ORIGIN}/dashboard`;
  const email = await WelcomeEmail.render({ name, dashboardUrl });
  const result = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  emailLogger.info(
    { to, resultId: result.data?.id, error: result.error },
    "Welcome email sent"
  );
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
  const securitySettingsUrl = `${env.CORS_ORIGIN}/dashboard/settings/security`;
  const email = await SecurityWarningEmail.render({
    name,
    ipAddress,
    device,
    location,
    timestamp,
    securitySettingsUrl,
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
  const email = await VerificationEmail.render({ name, verificationLink });
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
  const email = await DeleteVerificationEmail.render({
    name,
    verificationLink,
  });
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
  const email = await ResetPasswordEmail.render({ name, verificationLink });
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
  emailLogger.info(
    { to, organizationName, invitedBy },
    "Sending invitation email"
  );

  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const email = await InvitationEmail.render({
    invitationUrl,
    organizationName,
    invitedBy,
    invitationExpiresAt,
  });
  const result = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  emailLogger.info(
    { to, resultId: result.data?.id, error: result.error },
    "Invitation email sent"
  );
  return result;
}

export async function sendWaitlistConfirmationEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const email = await WaitlistConfirmationEmail.render({ name });
  return await resend.emails.send({
    from: env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}
