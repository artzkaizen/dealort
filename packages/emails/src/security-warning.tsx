/** @jsxImportSource react */
import { render, Section, Text } from "@react-email/components";
import type { CSSProperties } from "react";
import { EmailButton, EmailLayout, EmailText } from "./components/layout";

interface SecurityWarningEmailProps {
  name: string;
  ipAddress: string;
  device?: string;
  location?: string;
  timestamp: string;
  securitySettingsUrl?: string;
}

export function SecurityWarningEmail({
  name = "User",
  ipAddress = "192.168.1.1",
  device = "Chrome on Windows",
  location = "New York, USA",
  timestamp = "January 1, 2026 at 12:00 PM",
  securitySettingsUrl = "https://dealort.com/dashboard/settings/security",
}: SecurityWarningEmailProps) {
  return (
    <EmailLayout
      headerGradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
      preview="We detected a new login to your account"
      title="🔒 Security Alert"
    >
      <EmailText>Hi {name},</EmailText>
      <EmailText bold color="#dc2626">
        We detected a new login to your account from a new location or device.
      </EmailText>
      <Section style={detailsBox}>
        <Text style={detailItem}>
          <strong>IP Address:</strong> {ipAddress}
        </Text>
        {device && (
          <Text style={detailItem}>
            <strong>Device:</strong> {device}
          </Text>
        )}
        {location && (
          <Text style={detailItem}>
            <strong>Location:</strong> {location}
          </Text>
        )}
        <Text style={detailItem}>
          <strong>Time:</strong> {timestamp}
        </Text>
      </Section>
      <EmailText>
        If this was you, you can safely ignore this email. If you don't
        recognize this activity, please secure your account immediately.
      </EmailText>
      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <EmailButton href={securitySettingsUrl} variant="danger">
          Secure My Account
        </EmailButton>
      </div>
      <Text style={footerText}>
        Best regards,
        <br />
        The Dealort Security Team
      </Text>
    </EmailLayout>
  );
}

const detailsBox: CSSProperties = {
  background: "white",
  padding: "20px",
  borderRadius: "8px",
  borderLeft: "4px solid #f59e0b",
  margin: "20px 0",
};

const detailItem: CSSProperties = {
  margin: "10px 0",
  fontSize: "14px",
};

const footerText: CSSProperties = {
  fontSize: "14px",
  color: "#666",
  marginTop: "30px",
};

SecurityWarningEmail.subject = "🔒 Security Alert: New Login Detected";

SecurityWarningEmail.render = async (props: SecurityWarningEmailProps) => ({
  subject: SecurityWarningEmail.subject,
  html: await render(<SecurityWarningEmail {...props} />),
  text: await render(<SecurityWarningEmail {...props} />, { plainText: true }),
});

export default SecurityWarningEmail;
