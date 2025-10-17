import { UserCheck } from "lucide-react";
import React from "react";
import { TABS_CONFIG } from "./TabConfig";
import { RESPONSIBILITY_ROLES } from "@/app/constants/userRoles";

// Helper function to get tab icon
export const getTabIcon = (tab: string, size: "small" | "medium" = "small") => {
  const iconProps =
    size === "small"
      ? { className: "h-4 w-4" }
      : { className: "h-5 w-5 mr-2 text-primary" };

  const tabConfig = TABS_CONFIG.find((t) => t.value === tab);
  if (tabConfig?.icon) {
    const Icon = tabConfig.icon;
    return <Icon {...iconProps} />;
  }

  // Fallback to UserCheck if icon not found
  return <UserCheck {...iconProps} />;
};

// Define empty state messages for each tab
export const EMPTY_STATE_MESSAGES = {
  pending:
    "You don't have any pending requests that require your attention. When someone designates you as their representative or emergency contact, you'll receive a request here.",
  active:
    "You don't have any active responsibilities. Once you accept a pending request, your active responsibilities will appear here.",
  representatives: `You are not currently serving as an ${RESPONSIBILITY_ROLES.representative.title} for anyone. When someone designates you as their representative, it will appear here.`,
  "emergency-contacts": `You are not currently serving as an ${RESPONSIBILITY_ROLES.emergencyContact.title} for anyone. When someone adds you as their emergency contact, it will appear here.`,
  expired:
    "You don't have any expired responsibilities. Invitations that are not accepted within the designated timeframe will appear here.",
  default:
    "You don't have any responsibilities assigned to you yet. When someone designates you as their representative or emergency contact, it will appear here.",
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
