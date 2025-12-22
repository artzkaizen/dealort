import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { DashboardBreadcrumbs } from "./dashboard-breadcrumbs";

export function DashboardHeader() {
  const { location } = useRouterState();
  const currentPathname = location.pathname;
  const isSettingsRoute = currentPathname.includes("/settings");
  const { openMobile, setOpenMobile, toggleSidebar } = useSidebar();

  const handleSidebarToggle = () => {
    if (isSettingsRoute) {
      // On settings route, always toggle openMobile (for Sheet overlay)
      setOpenMobile(!openMobile);
    } else {
      // On other routes, use normal toggle behavior
      toggleSidebar();
    }
  };

  return (
    <div className="sticky top-0 z-45 flex h-15 w-full items-center justify-between border-b bg-sidebar/70 px-2 py-3 backdrop-blur-sm">
      <div className="flex grow items-center gap-3">
        {/* Sidebar Trigger */}
        <Button
          className="size-7 border-r"
          data-sidebar="trigger"
          onClick={handleSidebarToggle}
          size="icon"
          variant="ghost"
        >
          <Menu className="size-5 opacity-75" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>

        <div className="max-sm:hidden">
          <DashboardBreadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Add new product"
              asChild
              className="rounded-full"
              variant="secondary"
            >
              <Link to="/dashboard/products/new">
                <PlusIcon />
              </Link>
            </Button>
          </TooltipTrigger>

          <TooltipContent>Add new product</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
