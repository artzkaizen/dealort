/** @jsxImportSource react */
import { render } from "@react-email/components";
import { EmailFooter, EmailLayout, EmailText } from "./components/layout";

interface WaitlistConfirmationEmailProps {
  name: string;
}

export function WaitlistConfirmationEmail({
  name = "User",
}: WaitlistConfirmationEmailProps) {
  return (
    <EmailLayout
      preview="Thank you for joining the Dealort waitlist!"
      title="Thank you for joining the waitlist"
    >
      <EmailText>Hi {name},</EmailText>
      <EmailText>
        Thank you for joining the waitlist! We will be in touch soon.
      </EmailText>
      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <EmailFooter />
      </div>
    </EmailLayout>
  );
}

WaitlistConfirmationEmail.subject = "Thank you for joining the waitlist";

WaitlistConfirmationEmail.render = async (
  props: WaitlistConfirmationEmailProps
) => ({
  subject: WaitlistConfirmationEmail.subject,
  html: await render(<WaitlistConfirmationEmail {...props} />),
  text: await render(<WaitlistConfirmationEmail {...props} />, {
    plainText: true,
  }),
});

export default WaitlistConfirmationEmail;
