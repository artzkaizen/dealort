import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import {
  AlertTriangleIcon,
  ChevronLeft,
  ChevronRight,
  KeyIcon,
  Link2Icon,
  PanelsTopLeftIcon,
  Shield,
  UserCircle2Icon,
  UserIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/settings")({
  component: RouteComponent,
});

const settingsLinks = [
  {
    path: "/dashboard/settings",
    label: "Overview",
    icon: PanelsTopLeftIcon,
  },
  {
    path: "/dashboard/settings/profile",
    label: "Profile",
    icon: UserCircle2Icon,
  },
  {
    path: "/dashboard/settings/security",
    label: "Security",
    icon: Shield,
  },
  {
    path: "/dashboard/settings/sessions",
    label: "Sessions",
    icon: KeyIcon,
  },
  {
    path: "/dashboard/settings/accounts",
    label: "Accounts",
    icon: Link2Icon,
  },
  {
    path: "/dashboard/settings/danger",
    label: "Danger Zone",
    icon: AlertTriangleIcon,
  },
];

function RouteComponent() {
  const { data: session, isPending } = authClient.useSession();
  const { location } = useRouterState();
  const currentPathname = location.pathname;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Helper function to determine if a link is active
  const isLinkActive = (linkPath: string) => {
    // For the overview route, use exact matching
    if (linkPath === "/dashboard/settings") {
      return (
        currentPathname === "/dashboard/settings" ||
        currentPathname === "/dashboard/settings/"
      );
    }
    // For other routes, use prefix matching (so sub-routes are also active)
    return (
      currentPathname === linkPath || currentPathname.startsWith(`${linkPath}/`)
    );
  };

  // Check scroll position and update button visibility
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Scroll handlers
  const handleScrollLeft = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: -200, behavior: "smooth" });
  }, []);

  const handleScrollRight = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: 200, behavior: "smooth" });
  }, []);

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener("scroll", checkScrollPosition);
    window.addEventListener("resize", checkScrollPosition);

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [checkScrollPosition]);

  if (isPending) {
    return (
      <div className="flex flex-col gap-2 bg-secondary px-10 py-20">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!session) {
    return <div>Not found</div>;
  }

  const { user } = session || {};

  return (
    <main className="">
      <section className="flex items-center gap-1 px-2 py-5">
        <Avatar className="size-16">
          <AvatarImage src={user?.image || ""} />
          <AvatarFallback>
            <UserIcon className="size-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="font-medium text-sm sm:text-lg">{user?.name}</p>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {user?.email}
          </p>
        </div>
      </section>

      {/* Horizontal scrollable nav for medium and smaller screens */}
      <section className="relative mb-4 md:hidden">
        <div className="relative flex items-center">
          {/* Previous button */}
          <Button
            className={cn(
              "absolute left-0 z-10 size-8 rounded-full bg-background/80 shadow-md backdrop-blur-sm transition-opacity",
              {
                "pointer-events-none opacity-0": !canScrollLeft,
                "opacity-100": canScrollLeft,
              }
            )}
            onClick={handleScrollLeft}
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Scroll left</span>
          </Button>

          {/* Scrollable nav */}
          <div
            className="scrollbar-hide flex flex-1 gap-2 overflow-x-auto px-2 py-2"
            ref={scrollContainerRef}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {settingsLinks.map((link) => {
              const isActive = isLinkActive(link.path);
              return (
                <Link
                  className={cn(
                    "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md border px-3 py-2 text-primary/90 text-xs transition-colors hover:bg-muted",
                    {
                      "bg-muted font-medium text-primary": isActive,
                      "border-transparent": !isActive,
                    }
                  )}
                  key={link.path}
                  to={link.path}
                >
                  <link.icon className="size-4 shrink-0 text-muted-foreground" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Next button */}
          <Button
            className={cn(
              "absolute right-0 z-10 size-8 rounded-full bg-background/80 shadow-md backdrop-blur-sm transition-opacity",
              {
                "pointer-events-none opacity-0": !canScrollRight,
                "opacity-100": canScrollRight,
              }
            )}
            onClick={handleScrollRight}
            size="icon"
            variant="outline"
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Scroll right</span>
          </Button>
        </div>
      </section>

      <section className="flex min-h-[90vh] flex-col md:flex-row">
        {/* Vertical nav for larger screens */}
        <nav className="hidden min-h-full basis-[20%] flex-col gap-2 rounded-lg border-t border-r bg-secondary/10 px-2 pt-2 md:flex">
          {settingsLinks.map((link) => {
            const isActive = isLinkActive(link.path);
            return (
              <Link
                className={cn(
                  "flex items-center gap-2 rounded-md p-2 text-primary/90 text-xs hover:bg-muted lg:text-sm",
                  {
                    "border bg-muted font-medium text-primary": isActive,
                  }
                )}
                key={link.path}
                to={link.path}
              >
                <link.icon className="size-4 text-muted-foreground" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex-1">
          <Outlet />
        </div>
      </section>
    </main>
  );
}
