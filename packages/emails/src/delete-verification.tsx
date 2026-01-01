/** @jsxImportSource react */
import { render } from "@react-email/components";
import {
  EmailButton,
  EmailFooter,
  EmailLayout,
  EmailText,
} from "./components/layout";

interface DeleteVerificationEmailProps {
  name: string;
  verificationLink: string;
}

export function DeleteVerificationEmail({
  name = "User",
  verificationLink = "https://dealort.com/delete?token=example",
}: DeleteVerificationEmailProps) {
  return (
    <EmailLayout
      headerGradient="#dc2626"
      preview="Confirm your account deletion request"
      title="Confirm Account Deletion"
    >
      <EmailText>Hello {name},</EmailText>
      <EmailText>
        We're sorry to see you go! Please confirm your account deletion by
        clicking the button below:
      </EmailText>
      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <EmailButton href={verificationLink} variant="danger">
          Confirm Deletion
        </EmailButton>
      </div>
      <EmailText muted small>
        If you didn't request this deletion, please ignore this email.
      </EmailText>
      <EmailText muted small>
        This link will expire in 24 hours.
      </EmailText>
      <EmailFooter />
    </EmailLayout>
  );
}

DeleteVerificationEmail.subject = "Delete Your Account";

DeleteVerificationEmail.render = async (
  props: DeleteVerificationEmailProps
) => ({
  subject: DeleteVerificationEmail.subject,
  html: await render(<DeleteVerificationEmail {...props} />),
  text: await render(<DeleteVerificationEmail {...props} />, {
    plainText: true,
  }),
});

export default DeleteVerificationEmail;
