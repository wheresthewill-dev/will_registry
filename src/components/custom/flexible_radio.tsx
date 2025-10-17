"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";

// Interface for the RadioGroupProps
interface RadioGroupProps<T> {
  value: T;
  onValueChange: (value: T) => void;
  children: React.ReactNode;
  className?: string;
}

// Interface for RadioItemProps
interface RadioItemProps<T> {
  value: T;
  id?: string;
  className?: string;
  disabled?: boolean;
}

// Interface for RadioCardProps
interface RadioCardProps<T> {
  value: T;
  title: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

// Context to maintain radio group state with generic type
type RadioGroupContextType<T = any> = {
  value: T;
  onValueChange: (value: T) => void;
};

const RadioGroupContext = React.createContext<RadioGroupContextType>({
  value: undefined,
  onValueChange: () => {},
});

// RadioGroup component that accepts any type for value
function FlexibleRadioGroup<T>({
  value,
  onValueChange,
  className,
  children,
}: RadioGroupProps<T>) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn("grid gap-3", className)}>{children}</div>
    </RadioGroupContext.Provider>
  );
}

// RadioItem component
function FlexibleRadioItem<T>({
  value,
  id,
  className,
  disabled = false,
}: RadioItemProps<T>) {
  const { value: selectedValue, onValueChange } = React.useContext(RadioGroupContext);
  
  // Check if this item is selected
  const isSelected = React.useMemo(() => {
    return value === selectedValue;
  }, [value, selectedValue]);

  return (
    <button
      id={id}
      role="radio"
      type="button"
      aria-checked={isSelected}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      className={cn(
        "border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square h-4 w-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {isSelected && (
        <div className="flex items-center justify-center">
          <Circle className="fill-primary h-2 w-2" />
        </div>
      )}
    </button>
  );
}

// RadioCard component combining RadioItem with a label and description
function FlexibleRadioCard<T>({
  value,
  title,
  description,
  className,
  disabled = false,
}: RadioCardProps<T>) {
  const { value: selectedValue, onValueChange } = React.useContext(RadioGroupContext);
  
  // Check if this card is selected
  const isSelected = React.useMemo(() => {
    return value === selectedValue;
  }, [value, selectedValue]);

  return (
    <label
      onClick={() => !disabled && onValueChange(value)}
      className={cn(
        "flex items-start gap-4 border rounded-md px-4 py-3 cursor-pointer transition-colors",
        isSelected ? "border-primary shadow-sm" : "border-muted",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className="mt-0.5">
        <FlexibleRadioItem value={value} disabled={disabled} />
      </div>

      <div className="space-y-1 text-left">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </label>
  );
}

export { FlexibleRadioGroup, FlexibleRadioItem, FlexibleRadioCard };