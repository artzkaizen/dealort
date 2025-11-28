import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/react";
import { DashboardBreadcrumbs } from "@/components/dashboard/dashboard-breadcrumbs";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/authenticate",
        throw: true,
      });
    }
    return { session };
  },
});

function RouteComponent() {
  const {
    isPending, //loading state
  } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <NuqsAdapter>
      <SidebarProvider>
        <DashboardSidebar />
        <main className="w-full">
          <DashboardHeader />

          <div className="px-2 sm:hidden">
            <DashboardBreadcrumbs />
          </div>
          <Outlet />
        </main>
      </SidebarProvider>
    </NuqsAdapter>
  );
}
