import { createFileRoute } from "@tanstack/react-router";
import { OverviewAnalytics } from "@/components/dashboard/analytics/overview-analytics";
import { RevenueInflow } from "@/components/dashboard/analytics/revenue-inflow";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/stores/dashboard-store";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    // if (!session.data) {
    //   redirect({
    //     to: "/login",
    //     throw: true,
    //   });
    // }
    return { session };
  },
});

function RouteComponent() {
  // const { session } = Route.useRouteContext();
  //
  // const privateData = useQuery(orpc.privateData.queryOptions());

  const { analyticsDuration, setAnalyticsDuration } = useDashboardStore();

  return (
    <main className="px-2 py-5">
      <ButtonGroup>
        <Button
          className={cn("cursor-pointer bg-popover text-xs", {
            "bg-foreground text-foreground hover:bg-initial hover:text-background/90 dark:bg-foreground dark:text-background":
              analyticsDuration === "30 days",
          })}
          onClick={() => setAnalyticsDuration("30 days")}
          variant={"outline"}
        >
          30 days
        </Button>
        <Button
          className={cn("cursor-pointer bg-popover text-xs", {
            "bg-foreground text-background hover:bg-initial hover:text-background/90 dark:bg-foreground dark:text-background":
              analyticsDuration === "3 months",
          })}
          onClick={() => setAnalyticsDuration("3 months")}
          variant={"outline"}
        >
          3 months
        </Button>
        <Button
          className={cn("cursor-pointer bg-popover text-xs", {
            "bg-foreground text-background hover:bg-initial hover:text-background/90 dark:bg-foreground dark:text-background":
              analyticsDuration === "1 year",
          })}
          onClick={() => setAnalyticsDuration("1 year")}
          variant={"outline"}
        >
          1 Year
        </Button>
      </ButtonGroup>

      <section className="mt-7">
        <OverviewAnalytics />
      </section>

      <section className="mt-5">
        <RevenueInflow />
      </section>
    </main>
  );
}
