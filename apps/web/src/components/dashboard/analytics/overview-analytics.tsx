import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { useDashboardStore } from "@/stores/dashboard-store";

const analyticsCardsData = [
  {
    label: "Daily Revenue",
    value: "$612.10",
    change: {
      value: "+$36.15",
      positive: true,
      percent: "+6.3%",
    },
    info: "Last 30 Days",
    icon: <ArrowUpRight className="size-4 text-green-500" />,
  },
  {
    label: "Active Subscribers",
    value: "42,243",
    change: {
      value: "+12,451",
      positive: true,
      percent: "+4.8%",
    },
    info: "Last 30 Days",
    icon: <ArrowUpRight className="size-4 text-green-500" />,
  },
  {
    label: "New Subscribers",
    value: "1605",
    change: {
      value: "+305",
      positive: true,
      percent: "+23.5%",
    },
    info: "Last 30 Days",
    icon: <ArrowUpRight className="size-4 text-green-500" />,
  },
  {
    label: "Churn Rate",
    value: "3.2%",
    change: {
      value: "-8.1%",
      positive: false,
      percent: "-8.1%",
    },
    info: "Last 30 Days",
    icon: <ArrowDownRight className="size-4 text-red-500" />,
  },
];

export function OverviewAnalytics() {
  const { analyticsDuration } = useDashboardStore();

  // Here, analyticsDuration can be used to dynamically query/fetch data.
  // In this static example, just inject the value where "Last 30 Days" is used.

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
