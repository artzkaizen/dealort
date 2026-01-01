/** @jsxImportSource react */
import { render, Text } from "@react-email/components";
import type { CSSProperties } from "react";
import {
  EmailButton,
  EmailFooter,
  EmailLayout,
  EmailText,
} from "./components/layout";

interface InvitationEmailProps {
  invitationUrl: string;
  organizationName: string;
  invitedBy: string;
  invitationExpiresAt: string;
}

export function InvitationEmail({
  invitationUrl = "https://dealort.com/invite?token=example",
  organizationName = "Acme Inc",
  invitedBy = "John Doe",
  invitationExpiresAt = "January 15, 2026",
}: InvitationEmailProps) {
  return (
    <EmailLayout
      preview={`You've been invited to join ${organizationName}`}
      title="You've been invited!"
    >
      <EmailText>Hello,</EmailText>
      <EmailText>
        You've been invited to join <strong>{organizationName}</strong> on
        Dealort by <strong>{invitedBy}</strong>.
      </EmailText>
      <EmailText>
        Click the button below to accept the invitation and join the
        organization.
      </EmailText>
      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <EmailButton href={invitationUrl}>Accept Invitation</EmailButton>
      </div>
      <EmailText muted small>
        If the button doesn't work, you can copy and paste this link into your
        browser:
      </EmailText>
      <Text style={linkStyle}>{invitationUrl}</Text>
      <EmailText muted small>
        This invitation will expire on {invitationExpiresAt}.
      </EmailText>
      <EmailFooter />
    </EmailLayout>
  );
}

const linkStyle: CSSProperties = {
  fontSize: "12px",
  color: "#667eea",
  wordBreak: "break-all",
  marginTop: "10px",
  marginBottom: "20px",
};

InvitationEmail.getSubject = (organizationName: string) =>
  `You've been invited to join ${organizationName} on Dealort`;

InvitationEmail.render = async (props: InvitationEmailProps) => ({
  subject: InvitationEmail.getSubject(props.organizationName),
  html: await render(<InvitationEmail {...props} />),
  text: await render(<InvitationEmail {...props} />, { plainText: true }),
});

export default InvitationEmail;
