export function DeleteVerificationEmail({
  name,
  verificationLink,
}: {
  name: string;
  verificationLink: string;
}) {
  return {
    subject: "Delete Your Account",
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Confirm Account Deletion</h2>
        <p>Hello ${name},</p>
        <p>We're sorry to see you go! Please confirm your account deletion by clicking the button below:</p>
        <a href="${verificationLink}" style="background-color: #a30000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Confirm Deletion</a>
        <p>If you didn't request this deletion, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>Dealort Team</p>
      </div>
    `,
    text: `
      Confirm Account Deletion
      Hello ${name},
      We're sorry to see you go! Please confirm your account deletion by clicking the link below:
      ${verificationLink}
      If you don't have an account, please ignore this email.
      This link will expire in 24 hours.
      Best regards,
      Dealort Team
    `,
  };
}
