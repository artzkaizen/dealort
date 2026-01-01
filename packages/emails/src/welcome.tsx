/** @jsxImportSource react */
import { render } from "@react-email/components";
import {
  EmailButton,
  EmailFooter,
  EmailLayout,
  EmailText,
} from "./components/layout";

interface WelcomeEmailProps {
  name: string;
  dashboardUrl?: string;
}

export function WelcomeEmail({
  name = "User",
  dashboardUrl = "https://dealort.com/dashboard",
}: WelcomeEmailProps) {
  return (
    <EmailLayout preview="Welcome to Dealort!" title="Welcome to Dealort!">
      <EmailText>Hi {name},</EmailText>
      <EmailText>
        We're thrilled to have you on board! Your account has been successfully
        created.
      </EmailText>
      <EmailText>
        You can now start exploring all the features we have to offer. If you
        have any questions, feel free to reach out to our support team.
      </EmailText>
      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <EmailButton href={dashboardUrl}>Go to Dashboard</EmailButton>
      </div>
      <EmailFooter />
    </EmailLayout>
  );
}

WelcomeEmail.subject = "Welcome to Dealort! 🎉";

WelcomeEmail.render = async (props: WelcomeEmailProps) => ({
  subject: WelcomeEmail.subject,
  html: await render(<WelcomeEmail {...props} />),
  text: await render(<WelcomeEmail {...props} />, { plainText: true }),
});

export default WelcomeEmail;
