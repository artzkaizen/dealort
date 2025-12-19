import { createFileRoute } from "@tanstack/react-router";
import { OverviewAnalytics } from "@/components/dashboard/analytics/overview-analytics";
import { RevenueInflow } from "@/components/dashboard/analytics/revenue-inflow";
import { RevenueTable } from "@/components/dashboard/revenue-table";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/stores/dashboard-store";

export const Route = createFileRoute("/dashboard/")({
  component: RouteComponent,
  loader: async () => {
    // TODO: use queryclient for data fetch
    // const data = await context.queryClient.fetchQuery(orpc.privateData.queryOptions());
    // return { data };
  },
});

function DashboardSkeleton() {
  return (
    <main className="px-2 py-5">
      <section className="flex flex-col gap-1">
        <Skeleton className="mb-2 h-8 w-40 rounded sm:w-72" />
        <Skeleton className="h-5 w-80 rounded sm:w-[24rem]" />
      </section>

      <section className="mt-7">
        <div className="sticky top-16 z-10 flex gap-2">
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="h-8 w-20 rounded" />
        </div>

        <section className="mt-5 flex flex-col gap-4">
          {/* Analytics skeleton (3 cards side by side) */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Skeleton className="h-28 w-full rounded-lg sm:h-32 sm:w-1/3" />
            <Skeleton className="h-28 w-full rounded-lg sm:h-32 sm:w-1/3" />
            <Skeleton className="h-28 w-full rounded-lg sm:h-32 sm:w-1/3" />
          </div>
        </section>

        <section className="mt-5">
          <Skeleton className="h-44 w-full rounded-lg sm:h-60" />
        </section>
      </section>

      <hr className="my-10 py-px" />

      <section className="mt-5 rounded-lg bg-popover p-4">
        {/* Table skeleton: header + 6 rows */}
        <div className="flex flex-col gap-2">
          <div className="mb-2 flex gap-3">
            <Skeleton className="h-4 w-8 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="flex items-center gap-3" key={i}>
              <Skeleton className="h-4 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function RouteComponent() {
  const { data: session } = authClient.useSession();
  const { user } = session || {};
  // const privateData = useQuery(orpc.privateData.queryOptions());

  const { analyticsDuration, setAnalyticsDuration } = useDashboardStore();

  // if (loading) {
  //   return <DashboardSkeleton />;
  // }

  return (
    <main className="px-2 py-5 max-w-screen">
      <section className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl sm:text-4xl">
          Hi, {user?.name.split(" ")[0]}
        </h1>
        <p className="font-extralight text-xs sm:text-sm">
          Welcome back; want to launch something new today? There is no better
          tomorrow without a good today.
        </p>
      </section>

      <section className="mt-7">
        <ButtonGroup className="sticky top-16 z-10">
          <Button
            className={cn("cursor-pointer bg-popover text-xs", {
              "bg-foreground text-background hover:bg-initial hover:text-background/90 dark:bg-foreground dark:text-background":
                analyticsDuration === "30 days",
            })}
            onClick={() => setAnalyticsDuration("30 days")}
            variant={"outline"}
          >
            30 days
          </Button>
          <Button
            className={cn("cursor-pointer bg-popover text-xs", {
              "bg-foreground text-background hover:bg-initial hover:text-background/90 dark:bg-red-500 dark:text-red-400":
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

        <section className="mt-5">
          <OverviewAnalytics />
        </section>

        <section className="mt-5">
          <RevenueInflow />
        </section>
      </section>

      {/* <hr className="my-10 py-px" /> */}

      <section className="mt-5 rounded-lg bg-popover overflow-x-auto bg-red-500">
        {/* <RevenueTable /> */}
      </section>
    </main>
  );
}
