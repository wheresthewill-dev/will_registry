"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "grid" | "list";

export interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
  gridLabel?: string;
  listLabel?: string;
  showLabels?: boolean;
}

/**
 * A reusable component for toggling between grid and list views
 */
export function ViewToggle({
  viewMode,
  onViewChange,
  className = "",
  gridLabel = "Grid",
  listLabel = "List",
  showLabels = true,
}: ViewToggleProps) {
  return (
    <div className={`flex items-center rounded-md border p-1 ${className}`}>
      <Button
        variant={viewMode === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("grid")}
        className="flex-1"
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        {showLabels && gridLabel}
      </Button>
      <Button
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("list")}
        className="flex-1"
      >
        <List className="h-4 w-4 mr-2" />
        {showLabels && listLabel}
      </Button>
    </div>
  );
}

export default ViewToggle;
