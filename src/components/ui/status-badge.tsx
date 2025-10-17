import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VARIANT_STYLES } from "@/app/constants/ui-variants";

export type StatusType = "active" | "pending" | "expired" | "deceased";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isActive = status === "active";
  const isExpired = status === "expired";
  const isDeceased = status === "deceased";

  return (
    <Badge
      variant={"outline"}
      className={cn(
        "text-xs py-1 px-2",
        isActive
          ? VARIANT_STYLES.SUCCESS
          : isExpired
            ? VARIANT_STYLES.SECONDARY
            : isDeceased
              ? "border-slate-400 text-slate-600 bg-slate-50"
              : VARIANT_STYLES.WARNING,
        className
      )}
    >
      <div className="flex items-center">
        {isActive ? "Active" : isExpired ? "Expired" : isDeceased ? "Deceased" : "Pending"}
      </div>
    </Badge>
  );
}

export default StatusBadge;
