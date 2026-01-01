/** @jsxImportSource react */
import { render, Text } from "@react-email/components";
import type { CSSProperties } from "react";
import {
  EmailButton,
  EmailFooter,
  EmailLayout,
  EmailText,
} from "./components/layout";

interface VerificationEmailProps {
  name: string;
  verificationLink: string;
}

export function VerificationEmail({
  name = "User",
  verificationLink = "https://dealort.com/verify?token=example",
}: VerificationEmailProps) {
  return (
    <EmailLayout
      preview="Please verify your email address"
      title="Verify Your Email"
    >
      <EmailText>Hi {name},</EmailText>
      <EmailText>
        Thank you for signing up! Please verify your email address by clicking
        the button below.
      </EmailText>
      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <EmailButton href={verificationLink}>Verify Email Address</EmailButton>
      </div>
      <EmailText muted small>
        Or copy and paste this link into your browser:
      </EmailText>
      <Text style={linkStyle}>{verificationLink}</Text>
      <EmailText muted small>
        This link will expire in 24 hours. If you didn't create an account, you
        can safely ignore this email.
      </EmailText>
      <EmailFooter />
    </EmailLayout>
  );
}

const linkStyle: CSSProperties = {
  fontSize: "12px",
  color: "#667eea",
  wordBreak: "break-all",
  background: "white",
  padding: "10px",
  borderRadius: "5px",
  marginBottom: "20px",
};

VerificationEmail.subject = "Verify your email address";

VerificationEmail.render = async (props: VerificationEmailProps) => ({
  subject: VerificationEmail.subject,
  html: await render(<VerificationEmail {...props} />),
  text: await render(<VerificationEmail {...props} />, { plainText: true }),
});

export default VerificationEmail;
