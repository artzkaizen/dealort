/** @jsxImportSource react */
import { render } from "@react-email/components";
import {
  EmailButton,
  EmailFooter,
  EmailLayout,
  EmailText,
} from "./components/layout";

interface ResetPasswordEmailProps {
  name: string;
  verificationLink: string;
}

export function ResetPasswordEmail({
  name = "User",
  verificationLink = "https://dealort.com/reset-password?token=example",
}: ResetPasswordEmailProps) {
  return (
    <EmailLayout
      headerGradient="linear-gradient(135deg, #28a745 0%, #1e7e34 100%)"
      preview="Reset your Dealort password"
      title="Reset Your Password"
    >
      <EmailText>Hello {name},</EmailText>
      <EmailText>
        Please reset your password by clicking the button below:
      </EmailText>
      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <EmailButton href={verificationLink} variant="success">
          Reset Password
        </EmailButton>
      </div>
      <EmailText muted small>
        If you didn't request this reset, please ignore this email.
      </EmailText>
      <EmailText muted small>
        This link will expire in 20 minutes.
      </EmailText>
      <EmailFooter />
    </EmailLayout>
  );
}

ResetPasswordEmail.subject = "Reset Your Password";

ResetPasswordEmail.render = async (props: ResetPasswordEmailProps) => ({
  subject: ResetPasswordEmail.subject,
  html: await render(<ResetPasswordEmail {...props} />),
  text: await render(<ResetPasswordEmail {...props} />, { plainText: true }),
});

export default ResetPasswordEmail;
