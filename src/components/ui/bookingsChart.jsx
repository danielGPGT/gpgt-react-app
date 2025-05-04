import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown, PoundSterling, Users, CreditCard, Activity } from "lucide-react";
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
  return `£ ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
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
      {`Trending ${up ? 'up' : 'down'} by ${Math.abs(value).toFixed(1)}% this month`}
      {up ? (
        <TrendingUp className="inline w-4 h-4 text-green-600" />
      ) : (
        <TrendingDown className="inline w-4 h-4 text-red-600" />
      )}
    </span>
  );
}

function getMonthRangeString(monthlyData, year) {
  const monthsWithData = monthlyData.filter(m => m.bookings > 0 || m.totalSold > 0 || m.totalCost > 0 || m.pnl > 0);
  if (monthsWithData.length === 0) return '';
  const first = monthsWithData[0].month;
  const last = monthsWithData[monthsWithData.length - 1].month;
  return `${first} - ${last} ${year}`;
}

// Placeholder RecentBookings component


function BookingsChart() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [summary, setSummary] = useState({ bookings: 0, totalSold: 0, totalCost: 0, pnl: 0 });
  const [metrics, setMetrics] = useState({
    bookings: { current: 0, lastMonth: 0, lastYear: 0 },
    totalSold: { current: 0, lastMonth: 0, lastYear: 0 },
    totalCost: { current: 0, lastMonth: 0, lastYear: 0 },
    pnl: { current: 0, lastMonth: 0, lastYear: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: "all",
    event: "all"
  });
  const [uniqueSports, setUniqueSports] = useState([]);
  const [uniqueEvents, setUniqueEvents] = useState([]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  const now = new Date();
  const year = now.getFullYear();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("bookingFile");
        const bookings = res.data || [];
        
        // Extract unique sports and events
        const sports = [...new Set(bookings.map(b => b.sport).filter(Boolean))];
        const events = [...new Set(bookings.map(b => b.event_name).filter(Boolean))];
        setUniqueSports(sports);
        setUniqueEvents(events);

        // Filter bookings based on selected filters and date range
        let filteredBookings = bookings.filter(booking => {
          const sportMatch = filters.sport === "all" || booking.sport === filters.sport;
          const eventMatch = filters.event === "all" || booking.event_name === filters.event;
          let dateMatch = true;
          if (dateRange.from) {
            dateMatch = dateMatch && new Date(booking.booking_date) >= new Date(dateRange.from);
          }
          if (dateRange.to) {
            dateMatch = dateMatch && new Date(booking.booking_date) <= new Date(dateRange.to);
          }
          return sportMatch && eventMatch && dateMatch;
        });

        const month = now.getMonth();
        // Prepare monthly aggregates
        const monthly = Array.from({ length: 12 }, (_, i) => ({
          month: new Date(year, i).toLocaleString("default", { month: "short" }),
          bookings: 0,
          totalSold: 0,
          totalCost: 0,
          pnl: 0
        }));
        let bookingsSum = 0, totalSoldSum = 0, totalCostSum = 0, pnlSum = 0;
        // For metrics
        let bookingsThisMonth = 0, bookingsLastMonth = 0, bookingsLastYear = 0;
        let soldThisMonth = 0, soldLastMonth = 0, soldLastYear = 0;
        let costThisMonth = 0, costLastMonth = 0, costLastYear = 0;
        let pnlThisMonth = 0, pnlLastMonth = 0, pnlLastYear = 0;

        filteredBookings.forEach(b => {
          const d = new Date(b.booking_date);
          if (d.getFullYear() === year) {
            const m = d.getMonth();
            monthly[m].bookings += 1;
            monthly[m].totalSold += Number(b.total_sold_gbp) || 0;
            monthly[m].totalCost += Number(b.total_cost) || 0;
            monthly[m].pnl += Number(b["p&l"]) || 0;
            if (m === month) {
              bookingsThisMonth++;
              soldThisMonth += Number(b.total_sold_gbp) || 0;
              costThisMonth += Number(b.total_cost) || 0;
              pnlThisMonth += Number(b["p&l"]) || 0;
            } else if (m === month - 1) {
              bookingsLastMonth++;
              soldLastMonth += Number(b.total_sold_gbp) || 0;
              costLastMonth += Number(b.total_cost) || 0;
              pnlLastMonth += Number(b["p&l"]) || 0;
            }
          } else if (d.getFullYear() === year - 1 && d.getMonth() === month) {
            bookingsLastYear++;
            soldLastYear += Number(b.total_sold_gbp) || 0;
            costLastYear += Number(b.total_cost) || 0;
            pnlLastYear += Number(b["p&l"]) || 0;
          }
          // All-time summary
          bookingsSum++;
          totalSoldSum += Number(b.total_sold_gbp) || 0;
          totalCostSum += Number(b.total_cost) || 0;
          pnlSum += Number(b["p&l"]) || 0;
        });
        setMonthlyData(monthly);
        setSummary({ bookings: bookingsSum, totalSold: totalSoldSum, totalCost: totalCostSum, pnl: pnlSum });
        setMetrics({
          bookings: { current: bookingsThisMonth, lastMonth: bookingsLastMonth, lastYear: bookingsLastYear },
          totalSold: { current: soldThisMonth, lastMonth: soldLastMonth, lastYear: soldLastYear },
          totalCost: { current: costThisMonth, lastMonth: costLastMonth, lastYear: costLastYear },
          pnl: { current: pnlThisMonth, lastMonth: pnlLastMonth, lastYear: pnlLastYear },
        });
      } catch (e) {
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
  }, [filters, dateRange]); // Add dateRange as dependency

  if (loading) return <div className="text-center text-muted-foreground">Loading charts...</div>;

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap items-center">
        <Select
          value={filters.sport}
          onValueChange={(value) => setFilters(prev => ({ ...prev, sport: value }))}
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
          onValueChange={(value) => setFilters(prev => ({ ...prev, event: value }))}
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
        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDateRange({ from: null, to: null })}
          className="h-9"
        >
          Clear
        </Button>
      </div>

      {/* Overview cards row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {/* Bookings Made */}
        <Card className="p-6 flex flex-col justify-between shadow-sm border rounded-xl">
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground font-medium">Bookings Made</span>
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-foreground">{summary.bookings}</div>
            <div className="text-xs text-muted-foreground mt-1">{`${percentChange(metrics.bookings.current, metrics.bookings.lastMonth).toFixed(1)}% from last month`}</div>
          </div>
        </Card>
        {/* Total Costs */}
        <Card className="p-6 flex flex-col justify-between shadow-sm border rounded-xl">
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground font-medium">Total Costs</span>
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-foreground">{formatGBP(summary.totalCost)}</div>
            <div className="text-xs text-muted-foreground mt-1">{`${percentChange(metrics.totalCost.current, metrics.totalCost.lastMonth).toFixed(1)}% from last month`}</div>
          </div>
        </Card>
        {/* Total Sold */}
        <Card className="p-6 flex flex-col justify-between shadow-sm border rounded-xl">
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground font-medium">Total Sold</span>
            <PoundSterling className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-foreground">{formatGBP(summary.totalSold)}</div>
            <div className="text-xs text-muted-foreground mt-1">{`${percentChange(metrics.totalSold.current, metrics.totalSold.lastMonth).toFixed(1)}% from last month`}</div>
          </div>
        </Card>
        {/* Profit & Loss */}
        <Card className="p-6 flex flex-col justify-between shadow-sm border rounded-xl">
          <div className="flex items-start justify-between">
            <span className="text-sm text-muted-foreground font-medium">Profit & Loss</span>
            {summary.pnl >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div className="mt-4">
            <div className={`text-3xl font-bold ${summary.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>{formatGBP(summary.pnl)}</div>
            <div className="text-xs text-muted-foreground mt-1">{`${percentChange(metrics.pnl.current, metrics.pnl.lastMonth).toFixed(1)}% from last month`}</div>
          </div>
        </Card>
      </div>

      {/* P&L Chart and Recent Bookings side by side */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-12 md:col-span-4 h-full flex flex-col">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Profit & Loss</CardTitle>
              <CardDescription>{getMonthRangeString(monthlyData, year)}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <ChartContainer config={{}}>
                <BarChart accessibilityLayer data={monthlyData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel formatter={formatGBP} />}
                  />
                  <Bar dataKey="pnl" fill="var(--primary)" radius={8} />
                </BarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 font-medium leading-none">
                <Trend value={percentChange(metrics.pnl.current, metrics.pnl.lastMonth)} />
              </div>
              <div className="leading-none text-muted-foreground">
                Showing P&L for the last {monthlyData.filter(m => m.pnl !== 0).length} months
              </div>
            </CardFooter>
          </Card>
        </div>
        <div className="col-span-12 md:col-span-8 h-full flex flex-col">
          <RecentBookings />
        </div>
      </div>

      {/* Charts grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bookings Made per Month */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings Made</CardTitle>
            <CardDescription>{getMonthRangeString(monthlyData, year)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <BarChart accessibilityLayer data={monthlyData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="bookings" fill="var(--primary)" radius={8}>
                  <LabelList dataKey="bookings" position="top" offset={12} className="fill-foreground" fontSize={12} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              <Trend value={percentChange(metrics.bookings.current, metrics.bookings.lastMonth)} />
            </div>
            <div className="leading-none text-muted-foreground">
              Showing total bookings for the last {monthlyData.filter(m => m.bookings > 0).length} months
            </div>
          </CardFooter>
        </Card>
        {/* Total Costs per Month */}
        <Card>
          <CardHeader>
            <CardTitle>Total Costs</CardTitle>
            <CardDescription>{getMonthRangeString(monthlyData, year)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <BarChart accessibilityLayer data={monthlyData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel formatter={formatGBP} />}
                />
                <Bar dataKey="totalCost" fill="var(--primary)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              <Trend value={percentChange(metrics.totalCost.current, metrics.totalCost.lastMonth)} />
            </div>
            <div className="leading-none text-muted-foreground">
              Showing total costs for the last {monthlyData.filter(m => m.totalCost > 0).length} months
            </div>
          </CardFooter>
        </Card>
        {/* Total Sold GBP per Month */}
        <Card>
          <CardHeader>
            <CardTitle>Total Sold GBP</CardTitle>
            <CardDescription>{getMonthRangeString(monthlyData, year)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <BarChart accessibilityLayer data={monthlyData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel formatter={formatGBP} />}
                />
                <Bar dataKey="totalSold" fill="var(--primary)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              <Trend value={percentChange(metrics.totalSold.current, metrics.totalSold.lastMonth)} />
            </div>
            <div className="leading-none text-muted-foreground">
              Showing total sold for the last {monthlyData.filter(m => m.totalSold > 0).length} months
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
export { BookingsChart };

