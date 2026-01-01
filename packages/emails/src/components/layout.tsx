/** @jsxImportSource react */
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

interface EmailLayoutProps {
  preview: string;
  title: string;
  headerGradient?: string;
  children: ReactNode;
}

export function EmailLayout({
  preview,
  title,
  headerGradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  children,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ ...header, background: headerGradient }}>
            <Text style={headerTitle}>{title}</Text>
          </Section>
          <Section style={content}>{children}</Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "danger" | "success";
}) {
  const colors = {
    primary: "#667eea",
    danger: "#dc2626",
    success: "#28a745",
  };

  return (
    <a href={href} style={{ ...button, backgroundColor: colors[variant] }}>
      {children}
    </a>
  );
}

export function EmailText({
  children,
  muted = false,
  small = false,
  bold = false,
  color,
}: {
  children: ReactNode;
  muted?: boolean;
  small?: boolean;
  bold?: boolean;
  color?: string;
}) {
  return (
    <Text
      style={{
        ...text,
        color: color || (muted ? "#666" : "#333"),
        fontSize: small ? "14px" : "16px",
        fontWeight: bold ? 600 : 400,
      }}
    >
      {children}
    </Text>
  );
}

export function EmailFooter() {
  return (
    <Text style={footer}>
      Best regards,
      <br />
      The Dealort Team
    </Text>
  );
}

const main: CSSProperties = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  lineHeight: "1.6",
  color: "#333",
  backgroundColor: "#f5f5f5",
  padding: "20px",
};

const container: CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "10px",
  overflow: "hidden",
};

const header: CSSProperties = {
  padding: "30px",
  textAlign: "center" as const,
};

const headerTitle: CSSProperties = {
  color: "white",
  margin: "0",
  fontSize: "28px",
  fontWeight: "bold",
};

const content: CSSProperties = {
  padding: "30px",
  backgroundColor: "#f9fafb",
};

const text: CSSProperties = {
  fontSize: "16px",
  marginBottom: "20px",
};

const button: CSSProperties = {
  color: "white",
  padding: "12px 30px",
  textDecoration: "none",
  borderRadius: "5px",
  display: "inline-block",
  fontWeight: 600,
  textAlign: "center" as const,
};

const footer: CSSProperties = {
  fontSize: "14px",
  color: "#666",
  marginTop: "30px",
};
