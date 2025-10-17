import { Alert, AlertTitle } from "@/components/ui/alert";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils"; // Utility function for combining class names

const alertVariants = {
  success: {
    icon: CircleCheck,
    bgColor: "bg-emerald-500/10 dark:bg-emerald-600/30 border-none",
    textColor: "!text-emerald-500",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-500/10 dark:bg-blue-600/30 border-none",
    textColor: "!text-blue-500",
  },
  warning: {
    icon: TriangleAlert,
    bgColor: "bg-amber-500/10 dark:bg-amber-600/30 border-none",
    textColor: "!text-amber-500",
  },
  error: {
    icon: CircleAlert,
    bgColor: "bg-destructive/10 dark:bg-destructive/20 border-none",
    textColor: "!text-destructive",
  },
};

interface AlertCalloutProps {
  variant: keyof typeof alertVariants;
  message: ReactNode;
  className?: string;
}

export function AlertCallout({
  variant,
  message,
  className,
}: AlertCalloutProps) {
  const { icon: Icon, bgColor, textColor } = alertVariants[variant];

  return (
    <Alert className={cn(bgColor, className)}>
      {" "}
      {/* Combine bgColor and className */}
      <Icon className={`h-4 w-4 ${textColor}`} />
      <AlertTitle className={textColor}>{message}</AlertTitle>
    </Alert>
  );
}
