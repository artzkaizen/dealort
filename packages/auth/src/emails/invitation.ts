export function InvitationEmail({
  invitationUrl,
  organizationName,
  invitedBy,
  invitationExpiresAt,
}: {
  invitationUrl: string;
  organizationName: string;
  invitedBy: string;
  invitationExpiresAt: string;
}) {
  return {
    subject: `You've been invited to join ${organizationName} on Dealort`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Organization Invitation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">You've been invited!</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              You've been invited to join <strong>${organizationName}</strong> on Dealort by <strong>${invitedBy}</strong>.
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Click the button below to accept the invitation and join the organization.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 600;">Accept Invitation</a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #667eea; word-break: break-all; margin-top: 10px;">
              ${invitationUrl}
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              This invitation will expire on ${invitationExpiresAt}.
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Best regards,<br>
              The Dealort Team
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      You've been invited to join ${organizationName} on Dealort
      
      Hello,
      
      You've been invited to join ${organizationName} on Dealort by ${invitedBy}.
      
      Click the link below to accept the invitation and join the organization:
      ${invitationUrl}
      
      This invitation will expire on ${invitationExpiresAt}.
      
      Best regards,
      The Dealort Team
    `,
  };
}
