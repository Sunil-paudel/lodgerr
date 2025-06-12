
"use client";

import { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import type { DateRange } from "react-day-picker";

interface PropertyBookingCalendarProps {
  // Add any props this component might need, e.g., already booked dates
}

export function PropertyBookingCalendar({}: PropertyBookingCalendarProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const disabledDates = (date: Date) => {
    // Disable past dates, including today if you only want future bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    return date < today;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="booking-dates" className="text-sm font-medium">Dates</Label>
      <Calendar
        id="booking-dates"
        mode="range"
        selected={dateRange}
        onSelect={setDateRange}
        numberOfMonths={1}
        disabled={disabledDates}
        className="rounded-md border"
      />
    </div>
  );
}
