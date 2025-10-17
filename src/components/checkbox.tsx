"use client";

// TODO: Make these components as variants of Checkbox component from the UI library

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface BaseProps {
  value: boolean;
  id: string;
  label?: string;
  defaultChecked?: boolean;
  onChange: (checked: boolean) => void;
}

interface WithDescriptionProps extends BaseProps {
  description?: string;
}

export function SimpleCheckbox({
  id,
  label,
  defaultChecked,
  onChange,
}: BaseProps) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox
        id={id}
        defaultChecked={defaultChecked}
        onCheckedChange={onChange}
      />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}

export function CheckboxWithDescription({
  id,
  label,
  description,
  defaultChecked,
  onChange,
}: WithDescriptionProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        defaultChecked={defaultChecked}
        onCheckedChange={onChange}
      />
      <div className="grid gap-2">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-muted-foreground text-xs lg:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}

export function CardCheckbox({
  id,
  label,
  description,
  defaultChecked,
  onChange,
}: WithDescriptionProps) {
  return (
    <Label
      className={cn(
        "hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3",
        "data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50",
        "dark:data-[state=checked]:border-blue-900 dark:data-[state=checked]:bg-blue-950"
      )}
    >
      <Checkbox
        id={id}
        defaultChecked={defaultChecked}
        onCheckedChange={onChange}
        className={cn(
          "data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white",
          "dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
        )}
      />
      <div className="grid gap-1.5 font-normal">
        <p className="text-sm leading-none font-medium lg:text-sm">{label}</p>
        <p className="text-muted-foreground text-xs lg:text-sm">
          {description}
        </p>
      </div>
    </Label>
  );
}
