"use client";

import React from "react";
import { useRegistrationStore } from "@/stores/formStore";
import { STEP_ORDER, StepId } from "../steps";
import {
  Check,
  CreditCard,
  UserCircle,
  Package,
  CheckCircle,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Step information constants
const STEP_LABELS: Record<StepId, string> = {
  subscription: "Choose Plan",
  profile: "Your Details",
  payment: "Payment",
  confirmation: "Confirmation",
};

// Icon mapping for steps
const STEP_ICONS: Record<StepId, React.ReactNode> = {
  subscription: <BadgeCheck className="h-5 w-5" />,
  profile: <UserCircle className="h-5 w-5" />,
  payment: <CreditCard className="h-5 w-5" />,
  confirmation: <CheckCircle className="h-5 w-5" />,
};

// Style constants
const STYLES = {
  // Status-based colors
  status: {
    active: {
      bg: "bg-blue-600",
      text: "text-white",
      border: "ring-4 ring-blue-100",
      label: "text-blue-700",
      shadow: "shadow-lg",
      scale: "scale-110 transition-transform",
    },
    completed: {
      bg: "bg-emerald-500",
      text: "text-white",
      border: "",
      label: "text-emerald-700",
      shadow: "shadow-md shadow-emerald-100",
      scale: "",
    },
    upcoming: {
      bg: "bg-white",
      text: "text-slate-400",
      border: "border-2 border-slate-200",
      label: "text-slate-500 group-hover:text-slate-700",
      shadow: "",
      scale: "",
    },
  },
  // Common dimensions
  sizes: {
    icon: "h-5 w-5",
    stepCircle: "h-12 w-12",
    mobileStepCircle: "w-10 h-10",
    dotSize: "w-3 h-3",
    connector: {
      height: "h-1.5",
      mobileHeight: "h-1",
      maxWidth: "max-w-24",
    },
  },
  // Progress bar colors
  progressBar: {
    completed: "bg-emerald-500",
    upcoming: "bg-gray-300",
    active: "bg-blue-600",
  },
  // Mobile specific styles
  mobile: {
    card: "bg-white rounded-lg p-4 shadow-sm border border-slate-200",
    iconContainer: "rounded-full bg-indigo-100 text-indigo-600",
    stepCounter: "text-xs font-medium text-slate-500",
    completion: "text-xs font-medium text-indigo-600",
  },
  // Desktop specific styles
  desktop: {
    container: "hidden md:flex justify-center items-center max-w-4xl mx-auto",
    stepContainer: "flex flex-col items-center relative mx-8",
    numberBadge:
      "absolute top-0 right-0 bg-slate-200 text-slate-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium",
  },
  // Common styles
  common: {
    mainContainer:
      "w-full border-b border-slate-200 pb-6 mb-12 mt-5 pt-4 px-4 md:px-10 bg-white",
    rounded: "rounded-full",
    transition: "transition-all duration-200",
  },
};

export default function RegistrationStepper() {
  const { currentStep, subscriptionPlan, setCurrentStep } =
    useRegistrationStore();

  // Filter steps based on plan (skip payment for bronze)
  const visibleSteps = STEP_ORDER.filter((step) => {
    if (step === "payment" && subscriptionPlan === "bronze") {
      return false;
    }
    return true;
  });

  const currentIndex = visibleSteps.indexOf(currentStep);

  // Get step status based on index
  const getStepStatus = (index: number) => {
    if (index < currentIndex) return "completed";
    if (index === currentIndex) return "active";
    return "upcoming";
  };

  return (
    <div className={STYLES.common.mainContainer}>
      {/* Mobile view with simplified progress indicator */}
      <div className="md:hidden">
        {/* Header with step counter and completion percentage */}
        <div className="flex justify-between items-center mb-3">
          <div className={STYLES.mobile.stepCounter}>
            Step {currentIndex + 1} of {visibleSteps.length}
          </div>
          <div className={STYLES.mobile.completion}>
            {Math.round(((currentIndex + 1) / visibleSteps.length) * 100)}%
            Complete
          </div>
        </div>

        <div className="flex items-center w-full h-1 mb-7">
          {visibleSteps.map((step, index) => {
            const status = getStepStatus(index);
            const isLast = index === visibleSteps.length - 1;
            return (
              <React.Fragment key={step}>
                {/* Dot */}
                <div
                  className={cn(
                    STYLES.sizes.dotSize,
                    STYLES.common.rounded,
                    "z-10",
                    STYLES.progressBar[status]
                  )}
                />

                {/* Line after dot (except for the last item) */}
                {!isLast && (
                  <div
                    className={cn(
                      "flex-grow mx-1",
                      STYLES.sizes.connector.mobileHeight,
                      index < currentIndex
                        ? STYLES.progressBar.completed
                        : STYLES.progressBar.upcoming
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Current step info with icon */}
        <div className={cn(STYLES.mobile.card, "flex items-center gap-3")}>
          <div
            className={cn(
              STYLES.sizes.mobileStepCircle,
              STYLES.mobile.iconContainer,
              "flex items-center justify-center"
            )}
          >
            {STEP_ICONS[currentStep]}
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">
              Current Step
            </div>
            <div className="text-base font-semibold text-slate-800">
              {STEP_LABELS[currentStep]}
            </div>
          </div>
        </div>

        {/* Next step preview (if not on last step) */}
        {currentIndex < visibleSteps.length - 1 && (
          <div className="mt-3 text-sm text-slate-500 flex items-center gap-1 pl-2">
            <span>Next:</span>
            <span className="text-slate-700 font-medium">
              {STEP_LABELS[visibleSteps[currentIndex + 1]]}
            </span>
          </div>
        )}
      </div>

      {/* Desktop view with circles and lines */}
      <div className={STYLES.desktop.container}>
        {visibleSteps.map((step, index) => {
          const status = getStepStatus(index);
          const isClickable = index <= currentIndex;
          const statusStyles = STYLES.status[status];

          return (
            <React.Fragment key={step}>
              {/* Step circle with label */}
              <div
                className={cn(
                  STYLES.desktop.stepContainer,
                  status === "active" && statusStyles.scale
                )}
                aria-current={status === "active" ? "step" : undefined}
                aria-label={`${STEP_LABELS[step]} step, ${status}`}
              >
                <div
                  className={cn(
                    STYLES.sizes.stepCircle,
                    STYLES.common.rounded,
                    STYLES.common.transition,
                    "flex items-center justify-center",
                    statusStyles.bg,
                    statusStyles.text,
                    statusStyles.border,
                    statusStyles.shadow
                  )}
                >
                  {status === "completed" ? (
                    <Check className={STYLES.sizes.icon} />
                  ) : (
                    STEP_ICONS[step]
                  )}
                </div>

                <div
                  className={cn(
                    "text-sm font-medium mt-2 transition-colors",
                    statusStyles.label
                  )}
                >
                  {STEP_LABELS[step]}
                </div>

                {/* Step number indicator */}
                {status === "upcoming" && (
                  <span className={STYLES.desktop.numberBadge}>
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Connector line (except after last step) */}
              {index < visibleSteps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 mx-2 relative",
                    STYLES.sizes.connector.maxWidth
                  )}
                >
                  <div
                    className={cn(
                      STYLES.sizes.connector.height,
                      "w-full absolute top-6 rounded-full",
                      index < currentIndex
                        ? STYLES.progressBar.completed
                        : STYLES.progressBar.upcoming
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
