import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  isActive?: boolean;
  className?: string;
}

export function NotificationBadge({
  count,
  isActive = false,
  className,
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  return (
    <span className="relative inline-block">
      <Badge
        variant="outline"
        className={cn(
          "px-1.5 py-0.5 text-xs rounded-full transition-all duration-300",
          isActive
            ? "bg-amber-500 text-white border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse-glow"
            : "bg-amber-500 text-white/90",
          className
        )}
      >
        {count}
      </Badge>
      {isActive && (
        <span className="absolute inset-0 rounded-full ring-2 ring-amber-400/40 animate-ping" />
      )}
    </span>
  );
}

export default NotificationBadge;
