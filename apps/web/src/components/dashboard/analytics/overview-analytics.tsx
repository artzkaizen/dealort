import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { useDashboardStore } from "@/stores/dashboard-store";
import { client } from "@/utils/orpc";

export function OverviewAnalytics() {
  const { analyticsDuration } = useDashboardStore();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["analytics", "getOverviewAnalytics", userId, analyticsDuration],
    queryFn: () =>
      client.analytics.getOverviewAnalytics({
        userId: userId || "",
        duration: analyticsDuration,
      }),
    enabled: !!userId,
  });

  // Build cards data from API response
  const analyticsCardsData = [
    {
      label: "Revenue",
      value: "Coming Soon!",
      change: {
        value: "",
        positive: true,
        percent: "+0%",
      },
      icon: <ArrowUpRight className="size-4 text-green-500" />,
    },
    {
      label: "Impressions",
      value: analyticsData?.impressions?.value || "0",
      change: analyticsData?.impressions?.change || {
        value: "+0",
        positive: true,
        percent: "+0%",
      },
      icon: analyticsData?.impressions?.change?.positive ? (
        <ArrowUpRight className="size-4 text-green-500" />
      ) : (
        <ArrowDownRight className="size-4 text-red-500" />
      ),
    },
    {
      label: "Ratings",
      value: analyticsData?.ratings?.value || "0",
      change: analyticsData?.ratings?.change || {
        value: "+0",
        positive: true,
        percent: "+0%",
      },
      icon: analyticsData?.ratings?.change?.positive ? (
        <ArrowUpRight className="size-4 text-green-500" />
      ) : (
        <ArrowDownRight className="size-4 text-red-500" />
      ),
    },
    {
      label: "Expectancy",
      value: "Coming Soon!",
      change: {
        value: "",
        positive: true,
        percent: "+0%",
      },
      icon: <ArrowUpRight className="size-4 text-green-500" />,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["revenue", "impressions", "ratings", "expectancy"].map((label) => (
          <Card className="border-none bg-popover shadow-sm" key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="mb-2 h-8 w-24" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {analyticsCardsData.map((card) => (
        <Card className="border-none bg-popover shadow-sm" key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardDescription className="flex flex-col items-center gap-1 font-medium text-muted-foreground/80 text-xs">
                {card.label}
              </CardDescription>
            </div>
            {card.icon}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="font-semibold text-2xl">{card.value}</div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={clsx(
                  "font-medium text-xs",
                  card.change.positive ? "text-green-500" : "text-red-500"
                )}
              >
                {card.change.value}
              </span>
              <span
                className={clsx(
                  "text-xs",
                  card.change.positive ? "text-green-500" : "text-red-500"
                )}
              >
                {card.change.percent}
              </span>
              <span className="ml-1 text-muted-foreground text-xs">
                • {analyticsDuration}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
