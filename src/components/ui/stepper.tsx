"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const StepperContext = React.createContext<{
  activeStep: number;
  orientation: "horizontal" | "vertical";
  onChange?: (step: number) => void;
}>({
  activeStep: 0,
  orientation: "horizontal",
});

export interface StepperProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  activeStep?: number;
  orientation?: "horizontal" | "vertical";
  onChange?: (step: number) => void;
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      activeStep = 0,
      orientation = "horizontal",
      onChange,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const value = React.useMemo(
      () => ({ activeStep, orientation, onChange }),
      [activeStep, orientation, onChange]
    );

    return (
      <StepperContext.Provider value={value}>
        <div
          ref={ref}
          className={cn(
            "flex items-center mb-3",
            orientation === "vertical" ? "flex-col" : "flex-row",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </StepperContext.Provider>
    );
  }
);
Stepper.displayName = "Stepper";

export interface StepperStepProps extends React.HTMLAttributes<HTMLDivElement> {
  completed?: boolean;
  optional?: boolean;
  error?: boolean;
  disabled?: boolean;
  index?: number;
}

const StepperStep = React.forwardRef<HTMLDivElement, StepperStepProps>(
  (
    {
      className,
      completed,
      optional,
      error,
      disabled,
      index: indexProp,
      children,
      ...props
    },
    ref
  ) => {
    const { activeStep, orientation, onChange } =
      React.useContext(StepperContext);
    const childArray = React.Children.toArray(children);
    const index = indexProp ?? 0;

    // Determine step state
    const isActive = activeStep === index;
    const isCompleted = completed || activeStep > index;
    const isError = error;
    const isDisabled = disabled;

    // Handle click
    const handleClick = () => {
      if (!isDisabled && onChange) {
        onChange(index);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "vertical" ? "flex-col" : "items-center",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "flex flex-col items-center",
            orientation === "vertical" ? "pb-8" : ""
          )}
        >
          <div
            onClick={handleClick}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
              isActive && "border-primary bg-primary text-primary-foreground",
              isCompleted &&
                //TODO: Make color variable constant
                "border-green-600 bg-green-600 text-primary-foreground",
              isError &&
                "border-destructive bg-destructive text-destructive-foreground",
              isDisabled && "cursor-not-allowed opacity-50",
              !isActive &&
                !isCompleted &&
                !isError &&
                "border-input bg-background",
              !isDisabled && !isActive && ""
            )}
          >
            {isCompleted ? (
              <Check className="h-5 w-5" />
            ) : (
              <span className="text-sm font-medium">{index + 1}</span>
            )}
          </div>
          <div className="mt-2 text-center">{childArray}</div>
        </div>
      </div>
    );
  }
);
StepperStep.displayName = "StepperStep";

export interface StepperSeparatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  index?: number;
}

const StepperSeparator = React.forwardRef<
  HTMLDivElement,
  StepperSeparatorProps
>(({ className, index = 0, ...props }, ref) => {
  const { activeStep, orientation } = React.useContext(StepperContext);

  // Determine if this separator should be colored (when the step before it is active or completed)
  const isActive = activeStep > index;

  return (
    <div
      ref={ref}
      className={cn(
        "relative",
        orientation === "horizontal" ? "flex-1" : "h-full py-2",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          orientation === "horizontal"
            ? "h-[1px] w-full mb-10"
            : "h-full w-[1px] ml-5",
          isActive ? "bg-primary" : "bg-border",
          "transition-colors duration-200"
        )}
      />
    </div>
  );
});
StepperSeparator.displayName = "StepperSeparator";

export interface StepperLabelProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const StepperLabel = React.forwardRef<HTMLDivElement, StepperLabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("text-sm font-medium", className)}
        {...props}
      />
    );
  }
);
StepperLabel.displayName = "StepperLabel";

export interface StepperDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const StepperDescription = React.forwardRef<
  HTMLParagraphElement,
  StepperDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
});
StepperDescription.displayName = "StepperDescription";

export {
  Stepper,
  StepperStep,
  StepperSeparator,
  StepperLabel,
  StepperDescription,
};
