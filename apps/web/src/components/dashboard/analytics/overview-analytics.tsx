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

interface ChangeData {
  value: string;
  positive: boolean;
  percent: string;
}

interface AnalyticsCardData {
  label: string;
  value: string;
  change: ChangeData;
  icon: React.ReactNode;
}

interface AnalyticsData {
  impressions: {
    value: string;
    change: ChangeData;
  };
  ratings: {
    value: string;
    change: ChangeData;
  };
}

// Default change data for placeholder cards
const defaultChange: ChangeData = {
  value: "",
  positive: true,
  percent: "+0%",
};

// Default change data for empty analytics
const emptyChange: ChangeData = {
  value: "+0",
  positive: true,
  percent: "+0%",
};

// Helper function to get icon based on positive/negative change
function getChangeIcon(isPositive: boolean) {
  return isPositive ? (
    <ArrowUpRight className="size-4 text-green-500" />
  ) : (
    <ArrowDownRight className="size-4 text-red-500" />
  );
}

// Helper function to build analytics cards data
function buildAnalyticsCardsData(
  analyticsData: AnalyticsData | undefined
): AnalyticsCardData[] {
  return [
    {
      label: "Revenue",
      value: "Coming Soon!",
      change: defaultChange,
      icon: getChangeIcon(true),
    },
    {
      label: "Impressions",
      value: analyticsData?.impressions?.value || "0",
      change: analyticsData?.impressions?.change || emptyChange,
      icon: getChangeIcon(analyticsData?.impressions?.change?.positive ?? true),
    },
    {
      label: "Ratings",
      value: analyticsData?.ratings?.value || "0",
      change: analyticsData?.ratings?.change || emptyChange,
      icon: getChangeIcon(analyticsData?.ratings?.change?.positive ?? true),
    },
    {
      label: "Expectancy",
      value: "Coming Soon!",
      change: defaultChange,
      icon: getChangeIcon(true),
    },
  ];
}

export function OverviewAnalytics() {
  const { analyticsDuration } = useDashboardStore();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["analytics", "getOverviewAnalytics", userId, analyticsDuration],
    queryFn: () => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      // Type assertion needed due to Record<string, unknown> in router type
      return (
        client.analytics as {
          getOverviewAnalytics: (input: {
            userId: string;
            duration: "30 days" | "3 months" | "1 year";
          }) => Promise<AnalyticsData>;
        }
      ).getOverviewAnalytics({
        userId,
        duration: analyticsDuration,
      });
    },
    enabled: !!userId,
  });

  const analyticsCardsData = buildAnalyticsCardsData(analyticsData);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {analyticsCardsData.map((card) => (
        <AnalyticsCard
          analyticsDuration={analyticsDuration}
          card={card}
          key={card.label}
        />
      ))}
    </div>
  );
}

// Loading skeleton component
function LoadingSkeleton() {
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

// Analytics card component
function AnalyticsCard({
  card,
  analyticsDuration,
}: {
  card: AnalyticsCardData;
  analyticsDuration: string;
}) {
  return (
    <Card className="border-none bg-popover shadow-sm">
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
  );
}
