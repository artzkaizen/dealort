import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { ExternalLink, UserIcon } from "lucide-react";
import { UAParser } from "ua-parser-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/dashboard/settings/")({
  component: RouteComponent,
  loader: async () => {
    const accounts = await authClient.listAccounts();
    const sessions = await authClient.listSessions();
    return { accounts: accounts.data?.length, sessions: sessions.data?.length };
  },
});

function RouteComponent() {
  const { data: session } = authClient.useSession();
  const { accounts, sessions } = useLoaderData({
    from: "/dashboard/settings/",
  });
  const { user } = session || {};
  const { session: currentSession } = session || {};
  const userAgent = UAParser(currentSession?.userAgent || "");

  return (
    <div className="px-2 py-2">
      <section className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl">Overview</h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal information and other preference, view what you
          already setup.
        </p>
      </section>

      <section className="mt-5 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Avatar className="size-26">
              <AvatarImage src={user?.image || ""} />
              <AvatarFallback>
                <UserIcon className="" />
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-px">
              <p className="font-medium text-sm sm:text-lg">{user?.username}</p>
              <Link
                className="flex gap-1 text-muted-foreground text-xs sm:text-sm"
                to={`/profile/${user?.username}`}
              >
                Visit Public Profile <ExternalLink className="size-4" />
              </Link>
              <p className="text-[7px] text-muted-foreground sm:text-[9px]">
                Joined since {formatDate(user?.createdAt)}
              </p>
            </div>
          </div>

          <Badge variant={user?.emailVerified ? "default" : "secondary"}>
            {user?.emailVerified ? "Verified" : "Unverified"}
          </Badge>
        </div>

        <Separator className="my-2" />

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-px">
            <h3 className="font-medium text-xs sm:text-sm">
              Number of Connected Accounts
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {accounts || 0}
            </p>
          </div>

          <div className="flex flex-col gap-px">
            <h3 className="font-medium text-xs sm:text-sm">Number of Logins</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {sessions || 0}
            </p>
          </div>

          <div className="flex flex-col gap-px">
            <h3 className="font-medium text-xs sm:text-sm">Last Login</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {formatDate(currentSession?.createdAt)}
            </p>
          </div>

          <div className="flex flex-col gap-px">
            <h3 className="font-medium text-xs sm:text-sm">Login Expiration</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {formatDate(currentSession?.expiresAt)}
            </p>
          </div>

          <div className="flex flex-col gap-px">
            <h3 className="font-medium text-xs sm:text-sm">Preferred Theme</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {user?.theme}
            </p>
          </div>

          <div className="flex flex-col gap-px">
            <h3 className="font-medium text-xs sm:text-sm">Last login</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {userAgent.os.name}: {userAgent.browser.name}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
