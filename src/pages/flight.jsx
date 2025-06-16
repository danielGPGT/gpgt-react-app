import { FlightAPI } from "@/components/ui/flightAPI";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode"; 
import { CalendarDays, } from "lucide-react";

function FlightPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    }

    fetchCurrentUser();
  }, []);

  return (
    <main className="w-full">

          <div className="mt-6 w-full">
            <div className="flex items-center gap-3 mb-8">
              <CalendarDays className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">
                GPGT's Flight Search
              </h2>
            </div>
          </div>

          <div className="flex w-full justify-between mt-6 gap-6">
            <FlightAPI />
          </div>
      </main>
  );
}

export { FlightPage };
