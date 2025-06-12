
"use client";

import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import type { DateRange } from "react-day-picker";
import { startOfDay, differenceInCalendarDays, isBefore, isAfter, isValid, parseISO, isSameDay, format } from 'date-fns';
import type { Property } from '@/lib/types';

type ActiveBookingRange = { startDate: string; endDate: string };

interface PropertyBookingCalendarProps {
  selectedRange: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
  price: number;
  pricePeriod: Property['pricePeriod'];
  availableFrom?: Date | string;
  availableTo?: Date | string;
  activeBookings?: ActiveBookingRange[] | null; // New prop
}

export function PropertyBookingCalendar({
  selectedRange,
  onDateChange,
  price,
  pricePeriod,
  availableFrom,
  availableTo,
  activeBookings
}: PropertyBookingCalendarProps) {

  const processDateProp = (dateProp?: Date | string): Date | null => {
    if (!dateProp) return null;
    const date = typeof dateProp === 'string' ? parseISO(dateProp) : dateProp;
    return isValid(date) ? startOfDay(date) : null;
  };

  const normAvailableFrom = processDateProp(availableFrom);
  const normAvailableTo = processDateProp(availableTo);

  const [currentMonth, setCurrentMonth] = useState<Date>(
    selectedRange?.from && isValid(selectedRange.from) ? selectedRange.from :
    normAvailableFrom && isValid(normAvailableFrom) && isAfter(normAvailableFrom, new Date()) ? normAvailableFrom :
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
        if (numUnits === 0 && isSameDay(from, to)) {
            numUnits = 1;
        }
      } else if (pricePeriod === 'weekly') {
        numUnits = Math.max(1, Math.ceil(differenceInCalendarDays(to, from) / 7));
      } else if (pricePeriod === 'monthly') {
        numUnits = Math.max(1, Math.ceil(differenceInCalendarDays(to, from) / 30));
      }

      if (numUnits > 0) {
        setCalculatedPrice(price * numUnits);
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
    if (isBefore(dateAtMidnight, today)) return true;

    if (normAvailableFrom && isBefore(dateAtMidnight, normAvailableFrom)) return true;
    if (normAvailableTo && isAfter(dateAtMidnight, normAvailableTo)) return true;

    if (activeBookings && activeBookings.length > 0) {
      for (const booking of activeBookings) {
        const bookingStart = startOfDay(parseISO(booking.startDate));
        const bookingEnd = startOfDay(parseISO(booking.endDate));
        if (isValid(bookingStart) && isValid(bookingEnd)) {
          if (dateAtMidnight >= bookingStart && dateAtMidnight < bookingEnd) {
            return true;
          }
        }
      }
    }
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
            footerText = `Selected: ${format(selectedRange.from, 'LLL dd, yyyy')} - ${format(selectedRange.to, 'LLL dd, yyyy')}`;
        }
    } else {
        footerText = `Selected check-in: ${format(selectedRange.from, 'LLL dd, yyyy')}. Now select check-out.`;
    }
  }

  // Create a key for the Calendar that changes when activeBookings status changes
  // from loading (null) to loaded (array), or when the number of bookings changes.
  const calendarKey = activeBookings === null ? 'loading-bookings' : `loaded-bookings-${activeBookings.length}`;

  return (
    <div className="space-y-2">
      <Label htmlFor="booking-dates" className="text-sm font-medium">Select Dates</Label>
      <Calendar
        key={calendarKey} // Add key here to force re-evaluation when activeBookings change
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
        toDate={normAvailableTo || undefined}
        footer={
          activeBookings === null ? (
            <div className="pt-2 space-y-1 text-sm text-muted-foreground">
                Loading availability...
            </div>
          ) : (
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
          )
        }
      />
    </div>
  );
}
