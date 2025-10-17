"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  format?: "dd/MM/yyyy" | "dd MMMM yyyy" | "yyyy-MM-dd"; // Add ISO format
  outputFormat?: "dd/MM/yyyy" | "yyyy-MM-dd"; // Format for the onChange output
}

function formatDate(date: Date | undefined, format: "dd/MM/yyyy" | "dd MMMM yyyy" | "yyyy-MM-dd" = "dd/MM/yyyy") {
  if (!date) {
    return "";
  }
  
  if (format === "dd/MM/yyyy") {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).replace(/\//g, "/");
  }
  
  if (format === "yyyy-MM-dd") {
    const year = date.getFullYear();
    // Month is 0-indexed, so add 1 and pad with leading zero if needed
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

// Try to parse a date string in various formats
function parseDate(dateString: string): Date | undefined {
  if (!dateString) return undefined;
  
  // Check if it's ISO format YYYY-MM-DD
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const isoMatch = dateString.match(isoRegex);
  
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1; // JavaScript months are 0-indexed
    const day = parseInt(isoMatch[3], 10);
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      if (isValidDate(date) && date.getDate() === day && date.getMonth() === month) {
        return date;
      }
    }
  }
  
  // Try parsing DD/MM/YYYY format
  const parts = dateString.split(/[\/\s\.,-]+/);
  if (parts.length === 3) {
    // Check if first part is likely a year (4 digits)
    if (parts[0].length === 4 && !isNaN(parseInt(parts[0], 10))) {
      // Likely YYYY-MM-DD format
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day);
        if (isValidDate(date) && date.getDate() === day && date.getMonth() === month) {
          return date;
        }
      }
    } else {
      // Assume DD/MM/YYYY format
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day);
        if (isValidDate(date) && date.getDate() === day && date.getMonth() === month) {
          return date;
        }
      }
    }
  }
  
  // Fall back to standard date parsing
  const date = new Date(dateString);
  return isValidDate(date) ? date : undefined;
}

export function DatePicker({
  value = "",
  onChange,
  placeholder = "DD/MM/YYYY",
  disabled = false,
  className,
  format = "dd/MM/yyyy",
  outputFormat,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(parseDate(value));
  const [month, setMonth] = React.useState<Date | undefined>(date || new Date());
  const [inputValue, setInputValue] = React.useState(value);
  
  // Update the internal state when the external value changes
  React.useEffect(() => {
    const newDate = parseDate(value);
    setDate(newDate);
    setInputValue(value);
    if (newDate) {
      setMonth(newDate);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Try to parse the entered date
    const newDate = parseDate(newValue);
    if (newDate) {
      setDate(newDate);
      setMonth(newDate);
    } else {
      setDate(undefined);
    }
    
    // Pass the raw input value to the parent
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleCalendarSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // Format for display in the input field
      const displayFormat = formatDate(newDate, format);
      
      // Format for the onChange callback (if outputFormat is specified)
      const outputValue = outputFormat 
        ? formatDate(newDate, outputFormat) 
        : displayFormat;
      
      setDate(newDate);
      setInputValue(displayFormat);
      
      if (onChange) {
        onChange(outputValue);
      }
    }
    setOpen(false);
  };

  const clearDate = () => {
    setDate(undefined);
    setInputValue("");
    if (onChange) {
      onChange("");
    }
  };

  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      <div className="relative flex gap-2">
        <Input
          id="date"
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          className="bg-background pr-16" // Extra padding for both buttons
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        
        {/* Clear button - only show when there's a value */}
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            onClick={clearDate}
            className="absolute top-1/2 right-8 size-6 -translate-y-1/2"
            disabled={disabled}
          >
            <X className="size-3.5" />
            <span className="sr-only">Clear date</span>
          </Button>
        )}
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-picker"
              type="button"
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
              disabled={disabled}
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={handleCalendarSelect}
              disabled={(date) => disabled}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
