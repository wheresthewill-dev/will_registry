import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        success:
          "bg-emerald-500/10 border-emerald-600/50 text-emerald-600 dark:border-emerald-600 [&>svg]:text-emerald-600 bg",
        default: "bg-card text-card-foreground",
        destructive:
          "bg-destructive/10 border-destructive/50 text-destructive [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
        warning:
          "bg-amber-50 border-amber-200 text-amber-800 *:data-[slot=alert-description]:text-amber-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  variant = "default", // Default to "default" if no variant is provided
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "success" | "default" | "destructive" | "warning";
}) {
  const variantStyles = {
    success: "text-emerald-700 dark:text-emerald-400",
    default: "text-muted-foreground",
    destructive: "text-red-700 dark:text-red-400",
    warning: "text-amber-700 dark:text-amber-400",
  };

  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
