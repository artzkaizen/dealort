import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3Icon,
  ChevronsUpDownIcon,
  LayoutDashboard,
  LogOut,
  PackageIcon,
  Settings,
  User,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const dashboardLinks = [
  {
    path: "/dashboard" as const,
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  // Additional routes can be added here as they are created:
  {
    path: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3Icon,
  },
  {
    path: "/dashboard/products",
    label: "Products",
    icon: PackageIcon,
  },
  {
    path: "/dashboard/users",
    label: "Users",
    icon: Users,
  },
  // {
  //   path: "/dashboard/settings",
  //   label: "Settings",
  //   icon: Settings,
  // },
] as const;

// User profile component with tooltip for logout and settings
function UserProfile() {
  const { data: session, isPending } = authClient.useSession();
  const { user } = session || {};

  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const navigate = useNavigate();

  // Handle logout action
  const handleLogout = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: "/" });
        },
      },
    });
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-between border-t px-3 py-2">
        <div
          className={cn(
            "flex w-full max-w-[94%] items-center gap-3",
            isCollapsed && "max-w-full justify-center"
          )}
        >
          <div className="size-8 animate-pulse rounded-full bg-muted" />
          {!isCollapsed && (
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-2 w-32 animate-pulse rounded bg-muted" />
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        )}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center justify-between border-t">
          <div
            className={cn(
              "flex w-full max-w-[94%] cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors",
              isCollapsed && "max-w-full justify-center px-2"
            )}
          >
            <Avatar className="size-8">
              <AvatarImage alt="User" src={user?.image || ""} />
              <AvatarFallback>
                <User className="size-4" />
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate font-medium text-sm">
                  {user?.name}
                </span>
                <span className="truncate text-muted-foreground text-xs">
                  {user?.email}
                </span>
              </div>
            )}
          </div>

          <ChevronsUpDownIcon className="size-4" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="size-fit p-2" side="right">
        <div className="flex min-w-[120px] flex-col gap-1">
          <Button
            asChild
            className="w-full justify-start"
            size="sm"
            variant="ghost"
          >
            <Link to="/dashboard/settings">
              <Settings className="mr-2 size-4" />
              Settings
            </Link>
          </Button>
          <Button
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleLogout}
            size="sm"
            variant="ghost"
          >
            <LogOut className="mr-2 size-4" />
            Logout
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Sidebar content component (reusable for both normal and overlay modes)
function SidebarContentInner() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { location } = useRouterState();
  const currentPathname = location.pathname;

  // Helper function to determine if a link is active
  const isLinkActive = (linkPath: string) => {
    // For the dashboard home route, use exact matching
    if (linkPath === "/dashboard") {
      return (
        currentPathname === "/dashboard" || currentPathname === "/dashboard/"
      );
    }
    // For other routes, use prefix matching (so sub-routes are also active)
    return (
      currentPathname === linkPath || currentPathname.startsWith(`${linkPath}/`)
    );
  };

  return (
    <>
      {/* Sidebar Header with toggle button */}
      <SidebarHeader className="h-15 border-b px-2">
        <div className="flex w-full items-center justify-between">
          <h2 className="flex w-full items-center gap-1" id="">
            <Button aria-label="dealort dashboard" className="max-h-8" />
            {!isCollapsed && "Dealort"}
          </h2>
        </div>
      </SidebarHeader>

      {/* Sidebar Content with navigation links */}
      <SidebarContent className="pl-2">
        <SidebarMenu>
          {dashboardLinks.map((link) => {
            const Icon = link.icon;
            const isActive = isLinkActive(link.path);
            return (
              <SidebarMenuItem key={link.path}>
                <SidebarMenuButton asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        className={cn(
                          "flex h-full items-center gap-3 rounded-none rounded-s-xl px-2 py-2 text-sm",
                          {
                            "border-foreground border-r-4 bg-secondary text-accent-foreground":
                              isActive,
                          }
                        )}
                        // @ts-expect-error - TanStack Router types are strict and some dashboard routes may not be registered yet
                        to={link.path}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{link.label}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>{link.label}</TooltipContent>
                  </Tooltip>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Sidebar Footer with user profile */}
      <SidebarFooter>
        <UserProfile />
      </SidebarFooter>
    </>
  );
}

// Main Sidebar component
export function DashboardSidebar() {
  const { location } = useRouterState();
  const currentPathname = location.pathname;
  const isSettingsRoute = currentPathname.includes("/settings");
  const { openMobile, setOpenMobile } = useSidebar();

  // If on settings route, render as overlay (mobile-style)
  if (isSettingsRoute) {
    return (
      <Sheet onOpenChange={setOpenMobile} open={openMobile}>
        <SheetContent
          className="w-[18rem] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          data-mobile="true"
          data-sidebar="sidebar"
          side="left"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Navigation sidebar</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">
            <SidebarContentInner />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Normal sidebar rendering for non-settings routes
  return (
    <div className="z-50">
      <Sidebar className="border-r" collapsible="icon">
        <SidebarContentInner />
      </Sidebar>
    </div>
  );
}
