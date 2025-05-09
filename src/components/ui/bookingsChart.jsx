import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
  AreaChart,
  Area,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  PoundSterling,
  Users,
  CreditCard,
  Activity,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RecentBookings } from "@/components/ui/recentBookings";
import { DatePickerWithRange } from "@/components/ui/date-picker-range";

function formatGBP(value) {
  return `£ ${Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

function percentChange(current, prev) {
  if (prev === 0) return current === 0 ? 0 : 100;
  return ((current - prev) / Math.abs(prev)) * 100;
}

function Trend({ value }) {
  if (value === 0) return <span className="text-muted-foreground">0%</span>;
  const up = value > 0;
  return (
    <span className="flex items-center gap-1">
      {`Trending ${up ? "up" : "down"} by ${Math.abs(value).toFixed(
        1
      )}% this month`}
      {up ? (
        <TrendingUp className="inline w-4 h-4 text-success" />
      ) : (
        <TrendingDown className="inline w-4 h-4 text-primary" />
      )}
    </span>
  );
}

function getMonthRangeString(monthlyData, year) {
  const monthsWithData = monthlyData.filter(
    (m) => m.bookings > 0 || m.totalSold > 0 || m.totalCost > 0 || m.pnl > 0
  );
  if (monthsWithData.length === 0) return "";
  const first = monthsWithData[0].month;
  const last = monthsWithData[monthsWithData.length - 1].month;
  return `${first} - ${last} ${year}`;
}

// Placeholder RecentBookings component

function BookingsChart() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [summary, setSummary] = useState({
    bookings: 0,
    totalSold: 0,
    totalCost: 0,
    pnl: 0,
  });
  const [metrics, setMetrics] = useState({
    bookings: { current: 0, lastMonth: 0, lastYear: 0 },
    totalSold: { current: 0, lastMonth: 0, lastYear: 0 },
    totalCost: { current: 0, lastMonth: 0, lastYear: 0 },
    pnl: { current: 0, lastMonth: 0, lastYear: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: "all",
    event: "all",
  });
  const [timeRange, setTimeRange] = useState("7d");
  const [uniqueSports, setUniqueSports] = useState([]);
  const [uniqueEvents, setUniqueEvents] = useState([]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  const now = new Date();
  const year = now.getFullYear();

  // Calculate days to subtract based on timeRange
  const getDaysToSubtract = (range) => {
    switch (range) {
      case "7d":
        return 7;
      case "30d":
        return 30;
      case "365d":
        return 365;
      default:
        return 365;
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("bookingFile");
        const bookings = res.data || [];

        // Extract unique sports and events
        const sports = [
          ...new Set(bookings.map((b) => b.sport).filter(Boolean)),
        ];
        const events = [
          ...new Set(bookings.map((b) => b.event_name).filter(Boolean)),
        ];
        setUniqueSports(sports);
        setUniqueEvents(events);

        // Filter bookings based on selected filters and date range
        let filteredBookings = bookings.filter((booking) => {
          const sportMatch =
            filters.sport === "all" || booking.sport === filters.sport;
          const eventMatch =
            filters.event === "all" || booking.event_name === filters.event;
          let dateMatch = true;
          if (dateRange.from) {
            dateMatch =
              dateMatch &&
              new Date(booking.booking_date) >= new Date(dateRange.from);
          }
          if (dateRange.to) {
            dateMatch =
              dateMatch &&
              new Date(booking.booking_date) <= new Date(dateRange.to);
          }
          return sportMatch && eventMatch && dateMatch;
        });

        // Filter by time range
        const referenceDate = new Date();
        const daysToSubtract = getDaysToSubtract(timeRange);
        const startDate = new Date(referenceDate);
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - daysToSubtract);

        // Calculate previous period dates
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - daysToSubtract);

        filteredBookings = filteredBookings.filter((booking) => {
          const bookingDate = new Date(booking.booking_date);
          bookingDate.setHours(0, 0, 0, 0);
          return (
            bookingDate >= previousStartDate && bookingDate <= referenceDate
          );
        });

        // Group bookings by date for the area chart
        const dailyData = {};
        const currentPeriod = {
          bookings: 0,
          totalSold: 0,
          totalCost: 0,
          pnl: 0,
        };
        const previousPeriod = {
          bookings: 0,
          totalSold: 0,
          totalCost: 0,
          pnl: 0,
        };

        // Initialize all dates in both ranges with zero values
        const currentDate = new Date(previousStartDate);
        while (currentDate <= referenceDate) {
          const dateStr = currentDate.toISOString().split("T")[0];
          dailyData[dateStr] = {
            date: dateStr,
            pnl: 0,
            previousPnl: 0,
            bookings: 0,
            totalSold: 0,
            totalCost: 0,
          };
          currentDate.setDate(currentDate.getDate() + 1);
        }

        filteredBookings.forEach((booking) => {
          const bookingDate = new Date(booking.booking_date);
          bookingDate.setHours(0, 0, 0, 0);
          const dateStr = bookingDate.toISOString().split("T")[0];

          // Add to daily totals
          if (dailyData[dateStr]) {
            if (bookingDate >= startDate) {
              dailyData[dateStr].pnl += Number(booking["p&l"]) || 0;
            } else if (bookingDate >= previousStartDate) {
              dailyData[dateStr].previousPnl += Number(booking["p&l"]) || 0;
            }
            dailyData[dateStr].bookings += 1;
            dailyData[dateStr].totalSold += Number(booking.total_sold_gbp) || 0;
            dailyData[dateStr].totalCost += Number(booking.total_cost) || 0;
          }

          // Add to period totals
          if (bookingDate >= startDate) {
            currentPeriod.bookings += 1;
            currentPeriod.totalSold += Number(booking.total_sold_gbp) || 0;
            currentPeriod.totalCost += Number(booking.total_cost) || 0;
            currentPeriod.pnl += Number(booking["p&l"]) || 0;
          } else if (bookingDate >= previousStartDate) {
            previousPeriod.bookings += 1;
            previousPeriod.totalSold += Number(booking.total_sold_gbp) || 0;
            previousPeriod.totalCost += Number(booking.total_cost) || 0;
            previousPeriod.pnl += Number(booking["p&l"]) || 0;
          }
        });

        // Convert to array and sort by date
        const sortedDailyData = Object.values(dailyData).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        // Filter to only show current period in the chart
        const chartData = sortedDailyData
          .filter((item) => new Date(item.date) >= startDate)
          .map((item) => ({
            ...item,
            // Shift previous period data to align with current period
            previousPnl:
              sortedDailyData.find(
                (d) =>
                  new Date(d.date).getTime() ===
                  new Date(item.date).getTime() -
                    daysToSubtract * 24 * 60 * 60 * 1000
              )?.previousPnl || 0,
          }));

        setMonthlyData(chartData);
        setSummary(currentPeriod);
        setMetrics({
          bookings: {
            current: currentPeriod.bookings,
            lastMonth: previousPeriod.bookings,
            lastYear: previousPeriod.bookings,
          },
          totalSold: {
            current: currentPeriod.totalSold,
            lastMonth: previousPeriod.totalSold,
            lastYear: previousPeriod.totalSold,
          },
          totalCost: {
            current: currentPeriod.totalCost,
            lastMonth: previousPeriod.totalCost,
            lastYear: previousPeriod.totalCost,
          },
          pnl: {
            current: currentPeriod.pnl,
            lastMonth: previousPeriod.pnl,
            lastYear: previousPeriod.pnl,
          },
        });
      } catch (e) {
        console.error("Error fetching data:", e);
        setMonthlyData([]);
        setSummary({ bookings: 0, totalSold: 0, totalCost: 0, pnl: 0 });
        setMetrics({
          bookings: { current: 0, lastMonth: 0, lastYear: 0 },
          totalSold: { current: 0, lastMonth: 0, lastYear: 0 },
          totalCost: { current: 0, lastMonth: 0, lastYear: 0 },
          pnl: { current: 0, lastMonth: 0, lastYear: 0 },
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [filters, dateRange, timeRange]);

  if (loading)
    return (
      <div className="text-center text-muted-foreground">Loading charts...</div>
    );

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="flex gap-4 mb-4 flex-wrap items-center">
        <Select
          value={filters.sport}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, sport: value }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Sport" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {uniqueSports.map((sport) => (
              <SelectItem key={sport} value={sport}>
                {sport}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.event}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, event: value }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {uniqueEvents.map((event) => (
              <SelectItem key={event} value={event}>
                {event}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="365d">Last year</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview cards row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Bookings Made */}
        <Card className="p-6 flex flex-col justify-between shadow-sm border rounded-xl">
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground font-medium">
              Bookings Made
            </span>
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-foreground">
              {summary.bookings}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{`${percentChange(
              metrics.bookings.current,
              metrics.bookings.lastMonth
            ).toFixed(1)}% from previous ${
              timeRange === "7d"
                ? "7 days"
                : timeRange === "30d"
                ? "30 days"
                : "year"
            }`}</div>
          </div>
        </Card>
        {/* Total Costs */}
        <Card className="p-6 flex flex-col justify-between shadow-sm border rounded-xl">
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground font-medium">
              Total Costs
            </span>
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-foreground">
              {formatGBP(summary.totalCost)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{`${percentChange(
              metrics.totalCost.current,
              metrics.totalCost.lastMonth
            ).toFixed(1)}% from previous ${
              timeRange === "7d"
                ? "7 days"
                : timeRange === "30d"
                ? "30 days"
                : "year"
            }`}</div>
          </div>
        </Card>
        {/* Total Sold */}
        <Card className="p-6 flex flex-col justify-between shadow-sm border rounded-xl">
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground font-medium">
              Total Sold
            </span>
            <PoundSterling className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-foreground">
              {formatGBP(summary.totalSold)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{`${percentChange(
              metrics.totalSold.current,
              metrics.totalSold.lastMonth
            ).toFixed(1)}% from previous ${
              timeRange === "7d"
                ? "7 days"
                : timeRange === "30d"
                ? "30 days"
                : "year"
            }`}</div>
          </div>
        </Card>
        {/* Profit & Loss */}
        <Card className="p-6 flex flex-col justify-between shadow-sm border rounded-xl">
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground font-medium">
              Profit & Loss
            </span>
            {summary.pnl >= 0 ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="mt-4">
            <div
              className={`text-3xl font-bold ${
                summary.pnl >= 0 ? "text-success" : "text-primary"
              }`}
            >
              {formatGBP(summary.pnl)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{`${percentChange(
              metrics.pnl.current,
              metrics.pnl.lastMonth
            ).toFixed(1)}% from previous ${
              timeRange === "7d"
                ? "7 days"
                : timeRange === "30d"
                ? "30 days"
                : "year"
            }`}</div>
          </div>
        </Card>
      </div>

      {/* P&L Chart */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-12 h-full flex flex-col">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
              <div className="grid flex-1 gap-1 text-center sm:text-left">
                <CardTitle>Profit & Loss</CardTitle>
                <CardDescription>
                  Showing P&L for the last{" "}
                  {timeRange === "7d"
                    ? "7 days"
                    : timeRange === "30d"
                    ? "30 days"
                    : "year"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <ChartContainer
                config={{}}
                className="aspect-auto h-[250px] w-full"
              >
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="fillPnl" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--primary)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--primary)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    <linearGradient
                      id="fillPreviousPnl"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--muted-foreground)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--muted-foreground)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (!active || !payload) return null;

                      const currentDate = new Date(payload[0].payload.date);
                      const previousDate = new Date(
                        currentDate.getTime() -
                          getDaysToSubtract(timeRange) * 24 * 60 * 60 * 1000
                      );

                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] text-muted-foreground">
                                Current Period
                              </span>
                              <span className="font-bold text-foreground">
                                {currentDate.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                                : {formatGBP(payload[1].value)}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] text-muted-foreground">
                                Previous Period
                              </span>
                              <span className="font-bold text-foreground">
                                {previousDate.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                                : {formatGBP(payload[0].value)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    dataKey="previousPnl"
                    type="natural"
                    fill="url(#fillPreviousPnl)"
                    stroke="var(--muted-foreground)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    name="Previous Period"
                  />
                  <Area
                    dataKey="pnl"
                    type="natural"
                    fill="url(#fillPnl)"
                    stroke="var(--primary)"
                    name="Current Period"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 font-medium leading-none">
                <Trend
                  value={percentChange(
                    metrics.pnl.current,
                    metrics.pnl.lastMonth
                  )}
                />
              </div>
              <div className="leading-none text-muted-foreground">
                Showing P&L for the last {monthlyData.length} days
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Charts grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bookings Made per Month */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings Made</CardTitle>
            <CardDescription>
              Showing bookings for the last{" "}
              {timeRange === "7d"
                ? "7 days"
                : timeRange === "30d"
                ? "30 days"
                : "year"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <BarChart accessibilityLayer data={monthlyData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                  }
                />
                <Bar dataKey="bookings" fill="var(--primary)" radius={8}>
                  <LabelList
                    dataKey="bookings"
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              <Trend
                value={percentChange(
                  metrics.bookings.current,
                  metrics.bookings.lastMonth
                )}
              />
            </div>
            <div className="leading-none text-muted-foreground">
              Showing total bookings for the last {monthlyData.length} days
            </div>
          </CardFooter>
        </Card>
        {/* Total Costs per Month */}
        <Card>
          <CardHeader>
            <CardTitle>Total Costs</CardTitle>
            <CardDescription>
              Showing costs for the last{" "}
              {timeRange === "7d"
                ? "7 days"
                : timeRange === "30d"
                ? "30 days"
                : "year"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <BarChart accessibilityLayer data={monthlyData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                      formatter={formatGBP}
                    />
                  }
                />
                <Bar dataKey="totalCost" fill="var(--primary)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              <Trend
                value={percentChange(
                  metrics.totalCost.current,
                  metrics.totalCost.lastMonth
                )}
              />
            </div>
            <div className="leading-none text-muted-foreground">
              Showing total costs for the last {monthlyData.length} days
            </div>
          </CardFooter>
        </Card>
        {/* Total Sold GBP per Month */}
        <Card>
          <CardHeader>
            <CardTitle>Total Sold GBP</CardTitle>
            <CardDescription>
              Showing sales for the last{" "}
              {timeRange === "7d"
                ? "7 days"
                : timeRange === "30d"
                ? "30 days"
                : "year"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <BarChart accessibilityLayer data={monthlyData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                      formatter={formatGBP}
                    />
                  }
                />
                <Bar dataKey="totalSold" fill="var(--primary)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              <Trend
                value={percentChange(
                  metrics.totalSold.current,
                  metrics.totalSold.lastMonth
                )}
              />
            </div>
            <div className="leading-none text-muted-foreground">
              Showing total sold for the last {monthlyData.length} days
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
export { BookingsChart };
