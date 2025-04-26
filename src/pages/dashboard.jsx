import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "@/lib/api";
import { Events } from "@/components/ui/events";
import { BookingForm } from "@/components/ui/bookingForm";

function Dashboard() {
  const [user, setUser] = useState({
    first_name: "",
    last_name: "",
    role: "",
    company: "",
  });

  const [numberOfAdults, setNumberOfAdults] = useState(2); // <--- ADD THIS HERE

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setUser({
        first_name: decoded.first_name,
        last_name: decoded.last_name,
        role: decoded.role,
        company: decoded.company,
      });
    }
  }, []);

  return (
    <div className="p-8">
      <div className="flex w-full justify-between">
        <div>
      <h2 className="text-2xl font-bold mb-2">
        Welcome, {user.first_name} {user.last_name}
      </h2>
      <p>Role: {user.role}</p>
      <p>Company: {user.company}</p>
      </div>
      <div>
        <img src="/src/assets/imgs/gpgt_logo_vector_new.svg" className="w-80"></img>
      </div>
      </div>
      <div className="flex w-full justify-between mt-8 gap-6">
        <Events numberOfAdults={numberOfAdults} setNumberOfAdults={setNumberOfAdults} /> {/* pass down */}
        <BookingForm numberOfAdults={numberOfAdults} /> {/* pass down */}
      </div>
    </div>
  );
}

export { Dashboard };
