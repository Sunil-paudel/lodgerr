"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, MapPin, SearchIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { getSuggestedLocations } from '@/lib/mock-data';

const SearchBar = () => {
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
      new Promise(resolve => {
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => resolve(func(...args)), waitFor);
      });
  };

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (query.length > 1) {
        const suggestions = await getSuggestedLocations(query);
        setLocationSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    },
    []
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), [fetchSuggestions]);

  useEffect(() => {
    if (location.length > 1) {
      debouncedFetchSuggestions(location);
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  }, [location, debouncedFetchSuggestions]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocation(suggestion);
    setLocationSuggestions([]);
    setShowSuggestions(false);
  };
  
  const handleSearch = () => {
    console.log('Searching for:', {
      location,
      checkIn: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      checkOut: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      guests: 1, 
    });
  };

  return (
    <div className="bg-card p-4 md:p-6 rounded-lg shadow-lg mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="relative md:col-span-1">
          <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="location"
              type="text"
              placeholder="Where are you going?"
              value={location}
              onChange={handleLocationChange}
              onFocus={() => location && locationSuggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} 
              className="pl-10"
            />
          </div>
          {showSuggestions && locationSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-card border border-border rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
              {locationSuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onMouseDown={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="md:col-span-1">
          <label htmlFor="date" className="block text-sm font-medium text-foreground mb-1">
            Dates
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button onClick={handleSearch} className="w-full md:col-span-1 bg-accent hover:bg-accent/90 text-accent-foreground">
          <SearchIcon className="mr-2 h-5 w-5" /> Search
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;
