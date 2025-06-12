
"use client";

import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import type { DateRange } from "react-day-picker";
import { addDays, startOfDay, differenceInCalendarDays, differenceInCalendarWeeks, differenceInCalendarMonths, isBefore, isAfter } from 'date-fns';
import type { Property } from '@/lib/types';

interface PropertyBookingCalendarProps {
  selectedRange: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
  price: number;
  pricePeriod: Property['pricePeriod'];
  availableFrom?: Date; // Property's general start availability
  availableTo?: Date;   // Property's general end availability
  // In the future, this might take propertyId to fetch actual bookings
  // propertyId: string; 
}

// Example: Define some mock booked date ranges
const today = startOfDay(new Date());
const mockBookedDates: DateRange[] = [
  { from: addDays(today, 5), to: addDays(today, 7) },
  { from: addDays(today, 15), to: addDays(today, 16) },
];

export function PropertyBookingCalendar({ 
  selectedRange, 
  onDateChange, 
  price, 
  pricePeriod,
  availableFrom,
  availableTo 
}: PropertyBookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedRange?.from || availableFrom || today);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  useEffect(() => {
    if (selectedRange?.from && selectedRange?.to) {
      const from = startOfDay(selectedRange.from);
      const to = startOfDay(selectedRange.to);
      let numUnits = 0;

      if (pricePeriod === 'nightly') {
        numUnits = differenceInCalendarDays(to, from);
      } else if (pricePeriod === 'weekly') {
        numUnits = differenceInCalendarDays(to, from) / 7; 
      } else if (pricePeriod === 'monthly') {
        numUnits = differenceInCalendarDays(to, from) / 30; 
      }
      
      if (numUnits > 0) {
        setCalculatedPrice(price * numUnits);
      } else {
        // If numUnits is 0 (e.g. same day check-in/out for nightly), handle appropriately
        if (pricePeriod === 'nightly' && differenceInCalendarDays(to, from) === 0) {
          // Potentially charge for 1 night or disallow. For now, null price or 1 unit.
          setCalculatedPrice(price); // Assume 1 night for same-day checkout, can be adjusted
        } else {
          setCalculatedPrice(null);
        }
      }
    } else {
      setCalculatedPrice(null);
    }
  }, [selectedRange, price, pricePeriod]);

  const disabledDaysFunc = (dateToTest: Date): boolean => {
    const dateAtMidnight = startOfDay(dateToTest);

    // Disable dates before today
    if (dateAtMidnight < today) return true;

    // Disable dates outside the host-defined general availability window
    if (availableFrom && isBefore(dateAtMidnight, startOfDay(availableFrom))) return true;
    if (availableTo && isAfter(dateAtMidnight, startOfDay(availableTo))) return true;
    

    // Disable mock booked dates (replace with actual booking data later)
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

  let footerText = "Please select a check-in and check-out date.";
  if (selectedRange?.from) {
    if (selectedRange.to) {
        footerText = `Selected: ${selectedRange.from.toLocaleDateString()} - ${selectedRange.to.toLocaleDateString()}`;
    } else {
        footerText = `Selected check-in: ${selectedRange.from.toLocaleDateString()}. Now select check-out.`;
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="booking-dates" className="text-sm font-medium">Select Dates</Label>
      <Calendar
        id="booking-dates"
        mode="range"
        selected={selectedRange}
        onSelect={onDateChange}
        month={currentMonth}
        onMonthChange={handleMonthChange}
        numberOfMonths={1}
        disabled={disabledDaysFunc}
        className="rounded-md border shadow-sm bg-background"
        fromDate={availableFrom && isAfter(availableFrom, today) ? availableFrom : today} // Start calendar from today or availableFrom
        toDate={availableTo} // End calendar at availableTo if set
        footer={
          <div className="pt-2 space-y-1 text-sm">
            <p className="text-muted-foreground">{footerText}</p>
            {calculatedPrice !== null && selectedRange?.from && selectedRange?.to && differenceInCalendarDays(selectedRange.to, selectedRange.from) >=0 && (
              <p className="font-semibold text-primary">
                Estimated Price: ${calculatedPrice.toFixed(2)}
              </p>
            )}
          </div>
        }
      />
    </div>
  );
}

    