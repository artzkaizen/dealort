import React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDashboardStore } from "@/stores/dashboard-store";

export const description = "An interactive area chart for revenue inflow";

// Example data: now only two fields, 'date' and 'revenue'
const chartData = [
  // April 2024
  // March 2025
  { date: "2025-03-04", revenue: 821 },
  { date: "2025-03-12", revenue: 962 },
  { date: "2025-03-19", revenue: 1057 },
  { date: "2025-03-27", revenue: 989 },
  // April 2025
  { date: "2025-04-03", revenue: 888 },
  { date: "2025-04-12", revenue: 778 },
  { date: "2025-04-20", revenue: 1104 },
  { date: "2025-04-28", revenue: 947 },
  // May 2025
  { date: "2025-05-05", revenue: 1181 },
  { date: "2025-05-13", revenue: 902 },
  { date: "2025-05-20", revenue: 1368 },
  { date: "2025-05-27", revenue: 1005 },
  // June 2025
  { date: "2025-06-02", revenue: 1240 },
  { date: "2025-06-11", revenue: 1345 },
  { date: "2025-06-18", revenue: 1172 },
  { date: "2025-06-26", revenue: 1530 },
  // July 2025
  { date: "2025-07-04", revenue: 1422 },
  { date: "2025-07-13", revenue: 1690 },
  { date: "2025-07-21", revenue: 1239 },
  { date: "2025-07-29", revenue: 1571 },
  // August 2025
  { date: "2025-08-03", revenue: 1385 },
  { date: "2025-08-11", revenue: 1530 },
  { date: "2025-08-19", revenue: 1447 },
  { date: "2025-08-28", revenue: 1689 },
  // September 2025
  { date: "2025-09-06", revenue: 1598 },
  { date: "2025-09-15", revenue: 1484 },
  { date: "2025-09-22", revenue: 1737 },
  { date: "2025-09-29", revenue: 1610 },
  // October 2025
  { date: "2025-10-07", revenue: 1753 },
  { date: "2025-10-16", revenue: 1622 },
  { date: "2025-10-23", revenue: 1528 },
  { date: "2025-10-30", revenue: 1694 },
  // November 2025
  { date: "2025-11-05", revenue: 1801 },
  { date: "2025-11-13", revenue: 1926 },
  { date: "2025-11-20", revenue: 1732 },
  { date: "2025-11-28", revenue: 1669 },
  // December 2025
  { date: "2025-12-04", revenue: 1710 },
  { date: "2025-12-12", revenue: 1855 },
  { date: "2025-12-19", revenue: 1582 },
  { date: "2025-12-27", revenue: 1901 },
  // January 2026
  { date: "2026-01-05", revenue: 1623 },
  { date: "2026-01-13", revenue: 1702 },
  { date: "2026-01-20", revenue: 1745 },
  { date: "2026-01-28", revenue: 1867 },
  // February 2026
  { date: "2025-02-03", revenue: 1798 },
  { date: "2025-02-10", revenue: 1644 },
  { date: "2025-02-20", revenue: 1989 },
  { date: "2025-02-26", revenue: 1807 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function RevenueInflow() {
  const duration = useDashboardStore((s) => s.analyticsDuration || "1 year");

  // Filtering logic for revenue inflow based on dashboard duration
  const filteredData = React.useMemo(() => {
    const referenceDate = new Date("2024-06-30");
    let daysToSubtract = 0;
    if (duration === "3 months") {
      daysToSubtract = 90;
    } else if (duration === "30 days") {
      daysToSubtract = 30;
    } else {
      daysToSubtract = 365;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() + daysToSubtract);

    console.log(startDate);
    return chartData.filter((item) => {
      const date = new Date(item.date);
      return date >= startDate;
    });
  }, [duration]);

  return (
    <Card className="pt-0 relative overflow-hidden">
      <div className="z-7 text-center absolute top-0 right-0 w-full h-full bg-background/50 backdrop-blur-sm border-b border-border flex flex-col gap-2 justify-center items-center">
        <h2 className="text-2xl font-bold font-clash-display">Coming Soon!</h2>
        <p className="text-sm text-muted-foreground"> We are working on it and will be available soon.</p>
      </div>

      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Revenue Inflow</CardTitle>
          <CardDescription>
            Showing total revenue for the selected duration
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ScrollArea className="w-full overflow-x-auto">
          <ChartContainer
            className="aspect-auto h-[250px] min-w-[600px]" // min-w for scroll
            config={chartConfig}
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="date"
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
                tickLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                }
                cursor={false}
              />
              <Area
                dataKey="revenue"
                fill="url(#fillRevenue)"
                stroke="var(--chart-1)"
                type="natural"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
