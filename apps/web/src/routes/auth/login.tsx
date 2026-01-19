import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/auth/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: "/auth/login" });

  useEffect(() => {
    authClient.getSession().then((session) => {
      if (session.data?.user) {
        navigate({
          to: "/dashboard",
        });
      }
    });
  }, [navigate]);

  return (
    <LoginForm
      callbackURL={`${window.location.origin}/dashboard`}
      showCarousel={true}
    />
  );
}
