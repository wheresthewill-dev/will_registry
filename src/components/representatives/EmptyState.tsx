import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import React from "react";
import {
  getTabIcon,
  getEmptyStateMessage,
  REPRESENTATIVE_TABS_CONFIG,
  TabConfig,
} from "./TabConfig";
import AddRepresentativeModal from "@/app/dashboard/representatives/modals/AddRepresentativeModal";

interface EmptyStateProps {
  tabValue: string;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function EmptyState({
  tabValue,
  searchQuery,
  onClearSearch,
}: EmptyStateProps) {
  const isSearching = (searchQuery || "").trim().length > 0;
  const message = getEmptyStateMessage(tabValue, isSearching);
  const Icon = isSearching ? Search : getTabIcon(tabValue, "small").type;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-muted/50 p-4 rounded-full mb-4">
        <Icon className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">
        {isSearching
          ? `No results for "${searchQuery}"`
          : REPRESENTATIVE_TABS_CONFIG.find(
              (tab: TabConfig) => tab.value === tabValue
            )?.emptyTitle || "No representatives found"}
      </h3>
      <p className="text-muted-foreground max-w-sm mb-4">{message}</p>

      {isSearching ? (
        <Button variant="outline" onClick={onClearSearch} size="sm">
          <X className="mr-2" /> Clear search
        </Button>
      ) : (
        (tabValue === "active" || tabValue === "all") && (
          <AddRepresentativeModal />
        )
      )}
    </div>
  );
}

export default EmptyState;
