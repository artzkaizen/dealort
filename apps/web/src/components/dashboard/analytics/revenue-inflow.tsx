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
  { date: "2024-04-01", revenue: 372 },
  { date: "2024-04-02", revenue: 277 },
  { date: "2024-04-03", revenue: 287 },
  { date: "2024-04-04", revenue: 502 },
  { date: "2024-04-05", revenue: 663 },
  { date: "2024-04-06", revenue: 641 },
  { date: "2024-04-07", revenue: 425 },
  { date: "2024-04-08", revenue: 729 },
  { date: "2024-04-09", revenue: 169 },
  { date: "2024-04-10", revenue: 451 },
  { date: "2024-04-11", revenue: 677 },
  { date: "2024-04-12", revenue: 502 },
  { date: "2024-04-13", revenue: 722 },
  { date: "2024-04-14", revenue: 357 },
  { date: "2024-04-15", revenue: 290 },
  { date: "2024-04-16", revenue: 328 },
  { date: "2024-04-17", revenue: 806 },
  { date: "2024-04-18", revenue: 774 },
  { date: "2024-04-19", revenue: 423 },
  { date: "2024-04-20", revenue: 239 },
  { date: "2024-04-21", revenue: 337 },
  { date: "2024-04-22", revenue: 394 },
  { date: "2024-04-23", revenue: 368 },
  { date: "2024-04-24", revenue: 677 },
  { date: "2024-04-25", revenue: 465 },
  { date: "2024-04-26", revenue: 205 },
  { date: "2024-04-27", revenue: 803 },
  { date: "2024-04-28", revenue: 302 },
  { date: "2024-04-29", revenue: 555 },
  { date: "2024-04-30", revenue: 834 },
  { date: "2024-05-01", revenue: 385 },
  { date: "2024-05-02", revenue: 603 },
  { date: "2024-05-03", revenue: 437 },
  { date: "2024-05-04", revenue: 805 },
  { date: "2024-05-05", revenue: 871 },
  { date: "2024-05-06", revenue: 1018 },
  { date: "2024-05-07", revenue: 688 },
  { date: "2024-05-08", revenue: 359 },
  { date: "2024-05-09", revenue: 407 },
  { date: "2024-05-10", revenue: 623 },
  { date: "2024-05-11", revenue: 605 },
  { date: "2024-05-12", revenue: 437 },
  { date: "2024-05-13", revenue: 357 },
  { date: "2024-05-14", revenue: 938 },
  { date: "2024-05-15", revenue: 853 },
  { date: "2024-05-16", revenue: 738 },
  { date: "2024-05-17", revenue: 919 },
  { date: "2024-05-18", revenue: 665 },
  { date: "2024-05-19", revenue: 415 },
  { date: "2024-05-20", revenue: 407 },
  { date: "2024-05-21", revenue: 222 },
  { date: "2024-05-22", revenue: 201 },
  { date: "2024-05-23", revenue: 542 },
  { date: "2024-05-24", revenue: 514 },
  { date: "2024-05-25", revenue: 451 },
  { date: "2024-05-26", revenue: 383 },
  { date: "2024-05-27", revenue: 880 },
  { date: "2024-05-28", revenue: 423 },
  { date: "2024-05-29", revenue: 208 },
  { date: "2024-05-30", revenue: 620 },
  { date: "2024-05-31", revenue: 408 },
  { date: "2024-06-01", revenue: 378 },
  { date: "2024-06-02", revenue: 880 },
  { date: "2024-06-03", revenue: 263 },
  { date: "2024-06-04", revenue: 819 },
  { date: "2024-06-05", revenue: 228 },
  { date: "2024-06-06", revenue: 544 },
  { date: "2024-06-07", revenue: 693 },
  { date: "2024-06-08", revenue: 705 },
  { date: "2024-06-09", revenue: 918 },
  { date: "2024-06-10", revenue: 355 },
  { date: "2024-06-11", revenue: 242 },
  { date: "2024-06-12", revenue: 912 },
  { date: "2024-06-13", revenue: 211 },
  { date: "2024-06-14", revenue: 806 },
  { date: "2024-06-15", revenue: 657 },
  { date: "2024-06-16", revenue: 681 },
  { date: "2024-06-17", revenue: 995 },
  { date: "2024-06-18", revenue: 277 },
  { date: "2024-06-19", revenue: 631 },
  { date: "2024-06-20", revenue: 858 },
  { date: "2024-06-21", revenue: 379 },
  { date: "2024-06-22", revenue: 587 },
  { date: "2024-06-23", revenue: 1010 },
  { date: "2024-06-24", revenue: 312 },
  { date: "2024-06-25", revenue: 331 },
  { date: "2024-06-26", revenue: 814 },
  { date: "2024-06-27", revenue: 938 },
  { date: "2024-06-28", revenue: 349 },
  { date: "2024-06-29", revenue: 263 },
  { date: "2024-06-30", revenue: 846 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function RevenueInflow() {
  // Get analytics duration from dashboard store (e.g. "90d", "30d", "7d")
  const duration = useDashboardStore((s) => s.analyticsDuration || "90d");

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
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return chartData.filter((item) => {
      const date = new Date(item.date);
      return date >= startDate;
    });
  }, [duration]);

  return (
    <Card className="pt-0">
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
