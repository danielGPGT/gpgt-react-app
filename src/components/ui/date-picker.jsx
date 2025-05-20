import * as React from "react";
import { format, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

function DatePicker({ date, setDate, className, isFirstPayment = false }) {
  // Function to check if a date is the first day of the month
  const isFirstDayOfMonth = (date) => {
    if (!date || !isValid(date)) return false;
    return date.getDate() === 1;
  };

  // Function to handle date selection
  const handleSelect = (selectedDate) => {
    if (selectedDate && isValid(selectedDate) && isFirstDayOfMonth(selectedDate)) {
      setDate(selectedDate);
    }
  };

  // Function to format date safely
  const formatDate = (date) => {
    if (!date || !isValid(date)) return "";
    return format(date, "MMMM 1, yyyy");
  };

  // Handle upfront checkbox
  const handleUpfrontChange = (checked) => {
    if (checked) {
      setDate("upfront");
    } else {
      setDate(null);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      {isFirstPayment && (
        <div className="flex items-center space-x-2 mb-2">
          <Checkbox
            id="upfront"
            checked={date === "upfront"}
            onCheckedChange={handleUpfrontChange}
          />
          <Label htmlFor="upfront">Upfront Payment</Label>
        </div>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              (!date || date === "upfront") && "text-muted-foreground"
            )}
            disabled={date === "upfront"}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date === "upfront" ? (
              "Upfront Payment"
            ) : date && isValid(date) ? (
              formatDate(date)
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="single"
            selected={date && isValid(date) ? date : undefined}
            onSelect={handleSelect}
            disabled={(date) => !isFirstDayOfMonth(date)}
            modifiers={{
              firstDayOfMonth: (date) => isFirstDayOfMonth(date),
            }}
            modifiersStyles={{
              firstDayOfMonth: {
                fontWeight: "bold",
                color: "var(--primary)",
              },
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DatePicker }; 