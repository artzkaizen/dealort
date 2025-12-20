import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { BetterAuthActionButton } from "@/components/better-auth-action-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard/settings/danger")({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  async function handleDeleteAccount() {
    return await authClient.deleteUser({
      callbackURL: `${window.location.origin}/`,
    });
  }

  async function handleLogout() {
    return await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.invalidate();
          router.navigate({ to: "/auth/login" });
        },
      },
    });
  }

  return (
    <div>
      <section className="space-y-4 p-2">
        <div className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 font-bold text-lg sm:text-lg">
            <AlertCircle /> Danger Zone
          </h2>
          <p className="text-muted-foreground text-xs">
            Irreversible actions that cannot be undone.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Logout</CardTitle>
            <CardDescription className="flex flex-col gap-px text-muted-foreground text-xs">
              <p>
                This action will logout you from your account and all associated
                devices. This action is irreversible so make sure you want to do
                this.
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BetterAuthActionButton
              action={() => handleLogout()}
              areYouSureDescription="Are you sure you want to logout from your account?"
              requireAreYouSure
              variant={"destructive"}
            >
              Logout
            </BetterAuthActionButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delete Your Account</CardTitle>
            <CardDescription className="flex flex-col gap-px text-muted-foreground text-xs">
              <p>
                This action will permanently delete your account and all
                associated data. This action is irreversible so make sure you
                want to do this.
              </p>

              <strong>
                We do not want to lose you because you bring a lot of value to
                our platform.
              </strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BetterAuthActionButton
              action={() => handleDeleteAccount()}
              requireAreYouSure
              variant={"destructive"}
            >
              Delete Account
            </BetterAuthActionButton>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
