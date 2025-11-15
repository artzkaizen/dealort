import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3Icon,
  ChevronsUpDownIcon,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

// Define dashboard navigation links with icons
// Each link includes a path, label, and icon component
// Note: Additional routes can be added as they are created in the router
const dashboardLinks = [
  {
    path: "/dashboard" as const,
    label: "Overview",
    icon: LayoutDashboard,
  },
  // Additional routes can be added here as they are created:
  {
    path: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3Icon,
  },
  {
    path: "/dashboard/users",
    label: "Users",
    icon: Users,
  },
  {
    path: "/dashboard/documents",
    label: "Documents",
    icon: FileText,
  },
  // {
  //   path: "/dashboard/settings",
  //   label: "Settings",
  //   icon: Settings,
  // },
] as const;

// User profile component with tooltip for logout and settings
function UserProfile() {
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

  // Handle settings navigation
  const handleSettings = () => {
    navigate({ to: "/dashboard" });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center justify-between border-t">
          <div
            className={cn(
              "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors",
              isCollapsed && "justify-center px-2"
            )}
          >
            <Avatar className="size-8">
              <AvatarImage alt="User" src="" />
              <AvatarFallback>
                <User className="size-4" />
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate font-medium text-sm">User Name</span>
                <span className="truncate text-muted-foreground text-xs">
                  user@example.com
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
            className="w-full justify-start"
            onClick={handleSettings}
            size="sm"
            variant="ghost"
          >
            <Settings className="mr-2 size-4" />
            Settings
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

// Main Sidebar component
export function DashboardSidebar() {
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
    // Only show sidebar on large screens (lg breakpoint and above)
    <div className="hidden lg:block">
      <Sidebar className="border-r" collapsible="icon">
        {/* Sidebar Header with toggle button */}
        <SidebarHeader className="px-2">
          <div className="flex w-full items-center justify-between border-b py-2">
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
                    <Link
                      className={cn(
                        "flex items-center gap-3 rounded-none rounded-s-xl",
                        isActive &&
                          "border-foreground border-r-4 text-accent-foreground"
                      )}
                      // @ts-expect-error - TanStack Router types are strict and some dashboard routes may not be registered yet
                      to={link.path}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{link.label}</span>
                    </Link>
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
      </Sidebar>
    </div>
  );
}
