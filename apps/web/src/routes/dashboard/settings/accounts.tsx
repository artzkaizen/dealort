import {
  createFileRoute,
  useLoaderData,
  useRouter,
} from "@tanstack/react-router";
import { UnplugIcon } from "lucide-react";
import { toast } from "sonner";
import { GithubIcon, GoogleIcon } from "@/assets/icons";
import { BetterAuthActionButton } from "@/components/better-auth-action-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/dashboard/settings/accounts")({
  loader: async () => {
    const accounts = (await authClient.listAccounts()).data ?? [];
    const nonCredentialsAccounts = accounts.filter(
      (account) => account.providerId !== "credentials"
    );

    return { accounts: nonCredentialsAccounts };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const { refetch } = authClient.useSession();
  const { accounts } = useLoaderData({
    from: "/dashboard/settings/accounts",
  });

  async function handleDisconnectAccount(
    accountId: string,
    providerId: string
  ) {
    return await authClient.unlinkAccount(
      {
        accountId,
        providerId,
      },
      {
        onError: (error) => {
          toast.error(error.error.message || "Failed to disconnect account");
        },
        onSuccess: () => {
          toast.success("Account disconnected successfully");
          router.invalidate();
          refetch();
        },
      }
    );
  }

  return (
    <div>
      <section className="space-y-4 p-2">
        <div className="flex flex-col gap-2">
          <h2 className="font-bold text-lg sm:text-lg">Connected Accounts</h2>
          <p className="text-muted-foreground text-xs">
            View all accounts that are connected to your account.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {accounts?.map((account) => (
            <Card className="flex flex-row justify-between" key={account.id}>
              <CardHeader className="flex flex-1 flex-col gap-2">
                <CardTitle className="flex items-center gap-2 capitalize">
                  {account.providerId === "github" ? (
                    <GithubIcon className="size-6 dark:invert" />
                  ) : (
                    <GoogleIcon className="size-6" />
                  )}
                  {account.providerId}
                </CardTitle>
                <CardDescription className="flex flex-col gap-px text-muted-foreground text-xs">
                  <p>
                    <strong>Created At:</strong>{" "}
                    {formatDate(new Date(account.createdAt))}
                  </p>
                  <p>
                    <strong>Updated At:</strong>{" "}
                    {formatDate(new Date(account.updatedAt))}
                  </p>
                </CardDescription>
              </CardHeader>

              <CardContent>
                <BetterAuthActionButton
                  action={() =>
                    handleDisconnectAccount(
                      account.accountId,
                      account.providerId
                    )
                  }
                  aria-label="Unlink Account"
                  requireAreYouSure
                  variant="outline"
                >
                  <UnplugIcon />
                  <span className="text-xs max-sm:hidden">Unlink</span>
                </BetterAuthActionButton>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
