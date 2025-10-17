import { BellRing, CheckCircle2, ClockFading, Users } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface TabConfig {
  value: string;
  label: string;
  icon: LucideIcon;
  emptyTitle: string;
}

export const REPRESENTATIVE_TABS_CONFIG: TabConfig[] = [
  {
    value: "pending",
    label: "Pending Invitations",
    icon: BellRing,
    emptyTitle: "No pending invitations",
  },
  {
    value: "active",
    label: "Active Representatives",
    icon: CheckCircle2,
    emptyTitle: "No active representatives",
  },
  {
    value: "expired",
    label: "Expired Invitations",
    icon: ClockFading,
    emptyTitle: "No expired invitations",
  },
];

// Helper function to get tab icon
export const getTabIcon = (tab: string, size: "small" | "medium" = "small") => {
  const iconProps =
    size === "small"
      ? { className: "h-4 w-4" }
      : { className: "h-5 w-5 mr-2 text-primary" };

  const tabConfig = REPRESENTATIVE_TABS_CONFIG.find((t) => t.value === tab);
  if (tabConfig?.icon) {
    const Icon = tabConfig.icon;
    return <Icon {...iconProps} />;
  }

  // Fallback to Users if icon not found
  return <Users {...iconProps} />;
};

// Define empty state messages for each tab
export const EMPTY_STATE_MESSAGES = {
  active:
    "You don't have any active representatives. Once someone accepts your invitation, they'll appear here.",
  pending:
    "You don't have any pending representative invitations. When you invite someone, they'll appear here until they accept.",
  expired:
    "You don't have any expired invitations. Invitations that are not accepted within the designated timeframe will appear here.",
  default:
    "You don't have any representatives yet. You can invite trusted contacts to be your representatives.",
};

// Helper function to get empty state message
export const getEmptyStateMessage = (tab: string, isSearching: boolean) => {
  if (isSearching) {
    return "No matches found for your search. Try a different search term or clear your search.";
  }

  return (
    EMPTY_STATE_MESSAGES[tab as keyof typeof EMPTY_STATE_MESSAGES] ||
    EMPTY_STATE_MESSAGES.default
  );
};

export default REPRESENTATIVE_TABS_CONFIG;
