import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, PlusIcon } from "lucide-react";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "../mode-toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

// Breadcrumbs with ellipsis for overflow
function DashboardBreadcrumbs() {
  const { location } = useRouterState();
  // Remove query/hash
  const pathname = location.pathname.split("?")[0].split("#")[0];
  const segments = pathname.split("/").filter(Boolean);

  // Only keep parts under /dashboard
  const dashboardIdx = segments.indexOf("dashboard");
  if (dashboardIdx === -1) {
    return null;
  }
  const relSegments = segments.slice(dashboardIdx);

  // Build an array of { label, href }
  const crumbs = relSegments.map((seg, i) => {
    // Capitalize and replace dashes/underscores with spaces
    const label =
      seg === "dashboard"
        ? "Dashboard"
        : seg.replace(/-|_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    // Build the href up to this segment
    const href = `/${segments.slice(0, dashboardIdx + i + 1).join("/")}`;
    return { label, href };
  });

  // Define types for breadcrumb items
  interface CrumbItem {
    label: string;
    href: string;
  }
  interface EllipsisMarker {
    ellipsis: true;
  }
  type CrumbOrEllipsis = CrumbItem | EllipsisMarker;

  // Shorten logic
  let visibleCrumbs: CrumbOrEllipsis[] = [];
  let ellipsisCrumbs: CrumbItem[] = [];
  if (crumbs.length <= 3) {
    visibleCrumbs = crumbs;
  } else {
    visibleCrumbs = [
      crumbs[0], // "Dashboard"
      { ellipsis: true }, // Special marker
      ...crumbs.slice(-2),
    ];
    ellipsisCrumbs = crumbs.slice(1, -2);
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {visibleCrumbs.map((crumb, idx) => {
          if ("ellipsis" in crumb) {
            return (
              <React.Fragment key="ellipsis">
                <BreadcrumbSeparator />
                <Popover>
                  <PopoverTrigger asChild>
                    <BreadcrumbEllipsis />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="p-2" side="bottom">
                    <div className="flex flex-col gap-1">
                      {ellipsisCrumbs.map((c) => (
                        <BreadcrumbItem key={c.href}>
                          <BreadcrumbLink asChild>
                            <Link to={c.href}>{c.label}</Link>
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </React.Fragment>
            );
          }
          // TypeScript now knows crumb is CrumbItem here
          const breadcrumbItem = crumb as CrumbItem;
          return (
            <React.Fragment key={breadcrumbItem.href}>
              {idx !== 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {idx === visibleCrumbs.length - 1 ? (
                  <BreadcrumbPage className="truncate text-xs">
                    {breadcrumbItem.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="text-xs">
                    <Link to={breadcrumbItem.href}>{breadcrumbItem.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function DashboardHeader() {
  return (
    <div className="sticky top-0 flex w-full items-center justify-between border-b bg-sidebar px-4 py-3">
      <div className="flex grow items-center gap-3">
        {/* Sidebar Trigger */}
        <SidebarTrigger className="border-r">
          <Menu className="size-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </SidebarTrigger>

        <DashboardBreadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        <ModeToggle />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild className="rounded-xl" variant="default">
              <Link to="/dashboard">
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
