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
        to: "/auth/login",
        throw: true,
      });
    }
    return { session };
  },
  loader: async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const { data: session } = await authClient.getSession();
    return { session };
  },
  pendingComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="size-8" />
    </div>
  ),
});

function RouteComponent() {
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
