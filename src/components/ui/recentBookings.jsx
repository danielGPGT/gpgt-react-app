import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function formatGBP(value) {
  const num = Number(value) || 0;
  const sign = num >= 0 ? "+" : "-";
  return `${sign}£${Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function RecentBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thisMonthCount, setThisMonthCount] = useState(0);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await api.get("bookingFile");
        const all = res.data || [];
        const now = new Date();
        const thisMonth = all.filter(b => {
          const d = new Date(b.booking_date);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
        setThisMonthCount(thisMonth.length);
        // Get the most recent bookings from the end of the array
        setBookings(thisMonth.slice(-5).reverse());
      } catch (e) {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  return (
    <Card className="h-full flex w-full">
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
        <div className="text-muted-foreground text-sm font-normal">You made {thisMonthCount} bookings this month.</div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between w-full p-6 pb-0">
        {loading ? (
          <div className="text-muted-foreground text-center py-4">Loading...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {bookings.map((b, i) => (
              <div key={b.booking_ref || i} className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground text-base">{b.booker_name || "Unknown Booker"}</div>
                  <div className="text-muted-foreground text-sm">{b.booker_email || "-"}</div>
                </div>
                <div className={`font-bold text-base text-right ${b["p&l"] >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatGBP(b["p&l"])}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 