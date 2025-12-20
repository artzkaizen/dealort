import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_public/accept-invitation/$token")({
  component: RouteComponent,
});

function RouteComponent() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { data: session, refetch } = authClient.useSession();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "needs-auth"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [hasAttemptedAccept, setHasAttemptedAccept] = useState(false);

  const acceptInvitation = useCallback(async () => {
    try {
      setStatus("loading");
      const result = await authClient.organization.acceptInvitation({
        invitationId: token,
      });

      if (result.error) {
        const errorMsg = result.error.message?.toLowerCase() || "";
        const isAuthError =
          errorMsg.includes("unauthorized") ||
          errorMsg.includes("not authenticated") ||
          errorMsg.includes("sign in");

        if (isAuthError) {
          setStatus("needs-auth");
          setShowLoginDialog(true);
        } else {
          setStatus("error");
          const message = result.error.message || "Failed to accept invitation";
          setErrorMessage(message);
          toast.error(message);
        }
      } else {
        setStatus("success");
        toast.success("Invitation accepted successfully!");
        setTimeout(() => {
          navigate({ to: "/dashboard" });
        }, 2000);
      }
    } catch (error) {
      setStatus("error");
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setErrorMessage(message);
      toast.error(message);
    }
  }, [token, navigate]);

  // Initial check: if user is logged in, try to accept; if not, show dialog
  useEffect(() => {
    if (!hasAttemptedAccept) {
      setHasAttemptedAccept(true);
      if (session?.user) {
        acceptInvitation();
      } else {
        setStatus("needs-auth");
        setShowLoginDialog(true);
      }
    }
  }, [session, acceptInvitation, hasAttemptedAccept]);

  // When user logs in, close dialog and accept invitation
  useEffect(() => {
    if (session?.user && showLoginDialog) {
      setShowLoginDialog(false);
      acceptInvitation();
    }
  }, [session?.user, showLoginDialog, acceptInvitation]);

  // Handle login success callback
  const handleLoginSuccess = useCallback(async () => {
    await refetch();
    // The session effect will handle accepting the invitation
  }, [refetch]);

  return (
    <>
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accept Invitation</CardTitle>
            <CardDescription>
              {status === "loading" && "Processing your invitation..."}
              {status === "success" &&
                "Invitation accepted! Redirecting to dashboard..."}
              {status === "error" && "Failed to accept invitation"}
              {status === "needs-auth" &&
                "Please sign in to accept this invitation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "loading" && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground text-sm">
                  You have successfully accepted the invitation. You will be
                  redirected to the dashboard shortly.
                </p>
                <Button
                  className="w-full"
                  onClick={() => navigate({ to: "/dashboard" })}
                >
                  Go to Dashboard
                </Button>
              </div>
            )}

            {status === "needs-auth" && !showLoginDialog && (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground text-sm">
                  You need to be signed in to accept this invitation.
                </p>
                <Button
                  className="w-full"
                  onClick={() => setShowLoginDialog(true)}
                >
                  Sign In
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <p className="text-center text-destructive text-sm">
                  {errorMessage}
                </p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Try Again
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => navigate({ to: "/" })}
                  >
                    Go to Home
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog onOpenChange={setShowLoginDialog} open={showLoginDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              Please sign in to accept this invitation and join the
              organization.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <LoginForm
              callbackURL={`${window.location.origin}/accept-invitation/${token}`}
              newUserCallbackURL={`${window.location.origin}/accept-invitation/${token}`}
              onLoginSuccess={handleLoginSuccess}
              showCarousel={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
