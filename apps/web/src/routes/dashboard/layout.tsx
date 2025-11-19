import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <NuqsAdapter>
      <SidebarProvider>
        <DashboardSidebar />
        <main className="w-full">
          <DashboardHeader />
          <Outlet />
        </main>
      </SidebarProvider>
    </NuqsAdapter>
  );
}
