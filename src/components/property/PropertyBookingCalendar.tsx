
"use client";

import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import type { DateRange } from "react-day-picker";
import { addDays, startOfDay, differenceInCalendarDays, differenceInCalendarWeeks, differenceInCalendarMonths, isBefore, isAfter, isValid } from 'date-fns';
import type { Property } from '@/lib/types';

interface PropertyBookingCalendarProps {
  selectedRange: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
  price: number;
  pricePeriod: Property['pricePeriod'];
  availableFrom?: Date; // Property's general start availability
  availableTo?: Date;   // Property's general end availability
}

export function PropertyBookingCalendar({
  selectedRange,
  onDateChange,
  price,
  pricePeriod,
  availableFrom,
  availableTo
}: PropertyBookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(
    selectedRange?.from && isValid(selectedRange.from) ? selectedRange.from :
    availableFrom && isValid(availableFrom) ? availableFrom :
    startOfDay(new Date())
  );
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const today = startOfDay(new Date());

  useEffect(() => {
    if (selectedRange?.from && selectedRange?.to && isValid(selectedRange.from) && isValid(selectedRange.to)) {
      const from = startOfDay(selectedRange.from);
      const to = startOfDay(selectedRange.to);

      if (isBefore(to, from)) { // Ensure 'to' date is not before 'from' date
          setCalculatedPrice(null);
          return;
      }

      let numUnits = 0;

      if (pricePeriod === 'nightly') {
        numUnits = differenceInCalendarDays(to, from);
      } else if (pricePeriod === 'weekly') {
        numUnits = differenceInCalendarDays(to, from) / 7;
      } else if (pricePeriod === 'monthly') {
        // Approximate, or use a library for more precise month diff if needed
        numUnits = differenceInCalendarDays(to, from) / 30;
      }

      if (numUnits > 0) {
        setCalculatedPrice(price * numUnits);
      } else if (pricePeriod === 'nightly' && differenceInCalendarDays(to, from) === 0) {
        setCalculatedPrice(price); // Assume 1 night for same-day checkout
      } else {
        setCalculatedPrice(null);
      }
    } else {
      setCalculatedPrice(null);
    }
  }, [selectedRange, price, pricePeriod]);

  const disabledDaysFunc = (dateToTest: Date): boolean => {
    const dateAtMidnight = startOfDay(dateToTest);

    if (!isValid(dateAtMidnight)) return true; // Disable invalid dates

    // Disable dates before today
    if (dateAtMidnight < today) return true;

    // Disable dates outside the host-defined general availability window
    const normAvailableFrom = availableFrom && isValid(new Date(availableFrom)) ? startOfDay(new Date(availableFrom)) : null;
    const normAvailableTo = availableTo && isValid(new Date(availableTo)) ? startOfDay(new Date(availableTo)) : null;

    if (normAvailableFrom && isBefore(dateAtMidnight, normAvailableFrom)) return true;
    if (normAvailableTo && isAfter(dateAtMidnight, normAvailableTo)) return true;

    return false;
  };

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
  };

  let footerText = "Please select a check-in and check-out date.";
  if (selectedRange?.from && isValid(selectedRange.from)) {
    if (selectedRange.to && isValid(selectedRange.to)) {
        if (isBefore(selectedRange.to, selectedRange.from)) {
            footerText = "Check-out date cannot be before check-in date.";
        } else {
            footerText = `Selected: ${selectedRange.from.toLocaleDateString()} - ${selectedRange.to.toLocaleDateString()}`;
        }
    } else {
        footerText = `Selected check-in: ${selectedRange.from.toLocaleDateString()}. Now select check-out.`;
    }
  }
  
  // For debugging: Log the availableTo date received by the component
  // console.log("[BookingCalendar] Received availableFrom:", availableFrom, "Received availableTo:", availableTo);

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
        fromDate={
          availableFrom && isValid(new Date(availableFrom)) && isAfter(new Date(availableFrom), today)
            ? new Date(availableFrom)
            : today
        }
        toDate={availableTo && isValid(new Date(availableTo)) ? new Date(availableTo) : undefined}
        footer={
          <div className="pt-2 space-y-1 text-sm">
            <p className="text-muted-foreground">{footerText}</p>
            {calculatedPrice !== null &&
             selectedRange?.from && isValid(selectedRange.from) &&
             selectedRange?.to && isValid(selectedRange.to) &&
             !isBefore(selectedRange.to, selectedRange.from) && (
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
