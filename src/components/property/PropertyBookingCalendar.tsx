
"use client";

import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import type { DateRange } from "react-day-picker";
import { startOfDay, differenceInCalendarDays, isBefore, isAfter, isValid, parseISO } from 'date-fns';
import type { Property } from '@/lib/types';

interface PropertyBookingCalendarProps {
  selectedRange: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
  price: number;
  pricePeriod: Property['pricePeriod'];
  availableFrom?: Date | string; // Property's general start availability
  availableTo?: Date | string;   // Property's general end availability
}

export function PropertyBookingCalendar({
  selectedRange,
  onDateChange,
  price,
  pricePeriod,
  availableFrom,
  availableTo
}: PropertyBookingCalendarProps) {

  // Log received props for debugging
  // console.log("[BookingCalendar] Received Props: availableFrom:", availableFrom, "type:", typeof availableFrom, "isValid:", availableFrom ? isValid(new Date(availableFrom)) : 'N/A');
  // console.log("[BookingCalendar] Received Props: availableTo:", availableTo, "type:", typeof availableTo, "isValid:", availableTo ? isValid(new Date(availableTo)) : 'N/A');

  const processDateProp = (dateProp?: Date | string): Date | null => {
    if (!dateProp) return null;
    const date = typeof dateProp === 'string' ? parseISO(dateProp) : dateProp;
    return isValid(date) ? startOfDay(date) : null;
  };

  const normAvailableFrom = processDateProp(availableFrom);
  const normAvailableTo = processDateProp(availableTo);

  // console.log("[BookingCalendar] Normalized Dates: normAvailableFrom:", normAvailableFrom, "normAvailableTo:", normAvailableTo);


  const [currentMonth, setCurrentMonth] = useState<Date>(
    selectedRange?.from && isValid(selectedRange.from) ? selectedRange.from :
    normAvailableFrom && isValid(normAvailableFrom) ? normAvailableFrom :
    startOfDay(new Date())
  );
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const today = startOfDay(new Date());

  useEffect(() => {
    if (selectedRange?.from && selectedRange?.to && isValid(selectedRange.from) && isValid(selectedRange.to)) {
      const from = startOfDay(selectedRange.from);
      const to = startOfDay(selectedRange.to);

      if (isBefore(to, from)) { 
          setCalculatedPrice(null);
          return;
      }

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
      } else if (pricePeriod === 'nightly' && differenceInCalendarDays(to, from) === 0) {
         // For nightly, if check-in and check-out are same day, it implies 0 nights by diff.
         // Depending on policy, this could be 1 night or not allowed.
         // For simplicity, let's assume it means at least 1 unit of price if it's a valid selection.
         // This part might need refinement based on business logic for 0-day diffs.
         if (from.getTime() === to.getTime()) { // Strictly same day means 0 nights for calculation
            setCalculatedPrice(price); // Or handle as min 1 night's price if checkout isn't immediate
         } else {
            setCalculatedPrice(null);
         }
      } else {
        setCalculatedPrice(null);
      }
    } else {
      setCalculatedPrice(null);
    }
  }, [selectedRange, price, pricePeriod]);

  const disabledDaysFunc = (dateToTest: Date): boolean => {
    const dateAtMidnight = startOfDay(dateToTest);

    if (!isValid(dateAtMidnight)) return true; 

    if (dateAtMidnight < today) return true;

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
        fromDate={ normAvailableFrom && isAfter(normAvailableFrom, today) ? normAvailableFrom : today }
        toDate={normAvailableTo || undefined} // Use the normalized 'availableTo' for the calendar's toDate prop
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
