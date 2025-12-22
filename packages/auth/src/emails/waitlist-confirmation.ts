export function WaitlistConfirmationEmail({ name }: { name: string }) {
  return {
    subject: "Thank you for joining the waitlist",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank you for joining the waitlist</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Thank you for joining the waitlist</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for joining the waitlist! We will be in touch soon.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Best regards,<br>
               Dealort Team
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      Thank you for joining the waitlist
      
      Hi ${name},
      
      Thank you for joining the waitlist! We will be in touch soon.
      
      Best regards,
      The Dealort Team
    `,
  };
}
