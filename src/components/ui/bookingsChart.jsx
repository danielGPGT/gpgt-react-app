import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

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

  const now = new Date();
  const year = now.getFullYear();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("bookingFile");
        const bookings = res.data || [];
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
        bookings.forEach(b => {
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
  }, []);

  if (loading) return <div className="text-center text-muted-foreground">Loading charts...</div>;

  return (
    <div className="w-full">
      {/* Summary metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {/* Bookings Made */}
        <div className="rounded-lg border bg-card p-5 flex flex-col items-start">
          <span className="text-xs text-muted-foreground mb-1">Bookings Made</span>
          <span className="text-3xl font-bold text-foreground mb-2">{summary.bookings}</span>
          <span className="flex items-center gap-1 text-xs font-medium mb-1">
            <Trend value={percentChange(metrics.bookings.current, metrics.bookings.lastMonth)} />
            <span className="ml-1 text-muted-foreground">vs last month</span>
          </span>
          <span className="flex items-center gap-1 text-xs font-medium">
            <Trend value={percentChange(metrics.bookings.current, metrics.bookings.lastYear)} />
            <span className="ml-1 text-muted-foreground">vs last year</span>
          </span>
        </div>
        {/* Total Costs */}
        <div className="rounded-lg border bg-card p-5 flex flex-col items-start">
          <span className="text-xs text-muted-foreground mb-1">Total Costs</span>
          <span className="text-3xl font-bold text-foreground mb-2">{formatGBP(summary.totalCost)}</span>
          <span className="flex items-center gap-1 text-xs font-medium mb-1">
            <Trend value={percentChange(metrics.totalCost.current, metrics.totalCost.lastMonth)} />
            <span className="ml-1 text-muted-foreground">vs last month</span>
          </span>
          <span className="flex items-center gap-1 text-xs font-medium">
            <Trend value={percentChange(metrics.totalCost.current, metrics.totalCost.lastYear)} />
            <span className="ml-1 text-muted-foreground">vs last year</span>
          </span>
        </div>
        {/* Total Sold GBP */}
        <div className="rounded-lg border bg-card p-5 flex flex-col items-start">
          <span className="text-xs text-muted-foreground mb-1">Total Sold GBP</span>
          <span className="text-3xl font-bold text-foreground mb-2">{formatGBP(summary.totalSold)}</span>
          <span className="flex items-center gap-1 text-xs font-medium mb-1">
            <Trend value={percentChange(metrics.totalSold.current, metrics.totalSold.lastMonth)} />
            <span className="ml-1 text-muted-foreground">vs last month</span>
          </span>
          <span className="flex items-center gap-1 text-xs font-medium">
            <Trend value={percentChange(metrics.totalSold.current, metrics.totalSold.lastYear)} />
            <span className="ml-1 text-muted-foreground">vs last year</span>
          </span>
        </div>
        {/* P&L */}
        <div className="rounded-lg border bg-card p-5 flex flex-col items-start">
          <span className="text-xs text-muted-foreground mb-1">P&L</span>
          <span className={`text-3xl font-bold mb-2 ${summary.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>{formatGBP(summary.pnl)}</span>
          <span className="flex items-center gap-1 text-xs font-medium mb-1">
            <Trend value={percentChange(metrics.pnl.current, metrics.pnl.lastMonth)} />
            <span className="ml-1 text-muted-foreground">vs last month</span>
          </span>
          <span className="flex items-center gap-1 text-xs font-medium">
            <Trend value={percentChange(metrics.pnl.current, metrics.pnl.lastYear)} />
            <span className="ml-1 text-muted-foreground">vs last year</span>
          </span>
        </div>
      </div>
      {/* Charts grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Bookings Made per Month */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings Made</CardTitle>
            <CardDescription>{getMonthRangeString(monthlyData, year)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <BarChart data={monthlyData} margin={{ top: 20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis allowDecimals={false} />
                <Tooltip />
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
              <BarChart data={monthlyData} margin={{ top: 20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis tickFormatter={formatGBP} />
                <Tooltip formatter={formatGBP} />
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
              <BarChart data={monthlyData} margin={{ top: 20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis tickFormatter={formatGBP} />
                <Tooltip formatter={formatGBP} />
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
        {/* P&L per Month */}
        <Card>
          <CardHeader>
            <CardTitle>P&L</CardTitle>
            <CardDescription>{getMonthRangeString(monthlyData, year)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <BarChart data={monthlyData} margin={{ top: 20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis tickFormatter={formatGBP} />
                <Tooltip formatter={formatGBP} />
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
    </div>
  );
}

export { BookingsChart };
