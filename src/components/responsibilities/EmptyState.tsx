import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { getEmptyStateMessage, getTabIcon } from "./utils";

interface EmptyStateProps {
  tabValue: string;
  searchQuery: string;
  onClearSearch: () => void;
}

export function EmptyState({
  tabValue,
  searchQuery,
  onClearSearch,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6 border border-muted/30 shadow-sm">
        <div className="text-primary/70 scale-[1.8]">
          {getTabIcon(tabValue)}
        </div>
      </div>
      <h3 className="font-medium text-xl mb-3 text-foreground/90">
        {tabValue === "pending"
          ? "No pending requests"
          : tabValue === "active"
            ? "No active responsibilities"
            : tabValue === "representatives"
              ? "No representative responsibilities"
              : tabValue === "emergency-contacts"
                ? "No emergency contact responsibilities"
                : "No responsibilities found"}
      </h3>
      <p className="text-muted-foreground max-w-lg mx-auto mb-8 px-4 leading-normal text-base">
        {getEmptyStateMessage(tabValue, !!searchQuery)}
      </p>
      <div className="flex items-center justify-center gap-3">
        {searchQuery && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSearch}
            className="text-primary hover:text-primary hover:bg-primary/5 border-primary/20"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Clear search
          </Button>
        )}
      </div>
    </div>
  );
}

export default EmptyState;
