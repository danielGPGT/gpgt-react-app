import React from "react";
import { BookingsTable } from "@/components/ui/bookingsTable";

function ProvisionalBookingsTable() {
  // Pass a prop to BookingsTable to indicate provisional mode and extra columns
  return <BookingsTable provisional extraColumns={["deposit", "deposit_status"]} />;
}

export { ProvisionalBookingsTable }; 