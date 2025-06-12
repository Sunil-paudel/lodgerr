
"use client";

import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import type { DateRange } from "react-day-picker";
import { addDays, startOfDay } from 'date-fns';

interface PropertyBookingCalendarProps {
  // In the future, this might take propertyId to fetch actual bookings
  // propertyId: string;
}

// Example: Define some mock booked date ranges
// For demonstration, let's say a property is booked:
// - 5 to 7 days from now
// - 15 to 16 days from now
const today = startOfDay(new Date());
const mockBookedDates: DateRange[] = [
  { from: addDays(today, 5), to: addDays(today, 7) },
  { from: addDays(today, 15), to: addDays(today, 16) },
];

export function PropertyBookingCalendar({}: PropertyBookingCalendarProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState<Date>(today);

  // In a real scenario, you would fetch actual booked dates for the property
  // useEffect(() => {
  //   // fetchBookedDates(propertyId).then(setBookedDates);
  // }, [propertyId]);

  const disabledDays = (dateToTest: Date) => {
    const dateAtMidnight = startOfDay(dateToTest);

    // Disable past dates
    if (dateAtMidnight < today) {
      return true;
    }

    // Disable dates that fall within any of the mock booked ranges
    for (const bookedRange of mockBookedDates) {
      if (bookedRange.from && bookedRange.to) {
        if (dateAtMidnight >= startOfDay(bookedRange.from) && dateAtMidnight <= startOfDay(bookedRange.to)) {
          return true;
        }
      }
    }
    return false;
  };

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="booking-dates" className="text-sm font-medium">Select Dates</Label>
      <Calendar
        id="booking-dates"
        mode="range"
        selected={dateRange}
        onSelect={setDateRange}
        month={currentMonth}
        onMonthChange={handleMonthChange}
        numberOfMonths={1} // Consider 2 for better range selection UX
        disabled={disabledDays}
        className="rounded-md border shadow-sm"
        fromDate={today} // Don't allow navigation to past months
        footer={
          dateRange?.from && (
            <p className="text-sm text-muted-foreground pt-2">
              {dateRange.to ? (
                <>
                  Selected: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                </>
              ) : (
                <>
                  Selected: {dateRange.from.toLocaleDateString()}
                </>
              )}
            </p>
          )
        }
      />
      {dateRange?.from && !dateRange.to && (
        <p className="text-xs text-muted-foreground text-center">Please select a check-out date.</p>
      )}
    </div>
  );
}
