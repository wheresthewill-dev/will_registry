// Subscription Limits Configuration
// Centralized limit definitions for subscription-based features

import {
  SubscriptionLevel,
  SUBSCRIPTION_TIERS,
  getTierConfig,
} from "../interfaces/user_subscription";

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number | -1; // -1 means unlimited
  remaining: number | -1; // -1 means unlimited
  requiresUpgrade: boolean;
  suggestedTier?: SubscriptionLevel;
}

export interface UpgradePrompt {
  title: string;
  message: string;
  currentTier: SubscriptionLevel;
  suggestedTier: SubscriptionLevel;
  benefits: string[];
}

// Feature type definitions
export type LimitType =
  | "representatives"
  | "emergencyContacts"
  | "storageGB"
  | "documentsCount";

// Limit checking utilities
const checkSubscriptionLimit = (
  userTier: SubscriptionLevel,
  limitType: LimitType,
  currentUsage: number
): LimitCheckResult => {
  const config = getTierConfig(userTier);
  const limit = config.limits[limitType];

  const remaining = limit === -1 ? -1 : Math.max(0, limit - currentUsage);
  const allowed = limit === -1 || currentUsage < limit;

  return {
    allowed,
    current: currentUsage,
    limit,
    remaining,
    requiresUpgrade: !allowed,
    suggestedTier: !allowed
      ? getSuggestedUpgradeTier(userTier, limitType)
      : undefined,
  };
};

// Get the next tier that would accommodate the user's needs
const getSuggestedUpgradeTier = (
  currentTier: SubscriptionLevel,
  limitType: LimitType
): SubscriptionLevel => {
  const tiers: SubscriptionLevel[] = ["bronze", "silver", "gold", "platinum"];
  const currentIndex = tiers.indexOf(currentTier);

  // Find the next tier that has higher limits for this feature
  for (let i = currentIndex + 1; i < tiers.length; i++) {
    const tierConfig = getTierConfig(tiers[i]);
    const currentConfig = getTierConfig(currentTier);

    const tierLimit = tierConfig.limits[limitType];
    const currentLimit = currentConfig.limits[limitType];

    // If the next tier has unlimited or higher limit, suggest it
    if (tierLimit === -1 || (currentLimit !== -1 && tierLimit > currentLimit)) {
      return tiers[i];
    }
  }

  // Default to highest tier if no suitable tier found
  return "platinum";
};

// Utility function to safely check if a limit is unlimited
const isUnlimited = (limit: number): boolean => limit === -1;

// Utility function to get a limit value with type safety
const getLimitValue = (limit: number): number | -1 => limit;

// Generate upgrade prompts based on limit type
const generateUpgradePrompt = (
  currentTier: SubscriptionLevel,
  limitType: LimitType,
  currentUsage: number
): UpgradePrompt => {
  const suggestedTier = getSuggestedUpgradeTier(currentTier, limitType);
  const suggestedConfig = getTierConfig(suggestedTier);

  const prompts: Record<
    LimitType,
    (current: SubscriptionLevel, suggested: SubscriptionLevel) => UpgradePrompt
  > = {
    representatives: (current, suggested) => ({
      title: "Representative Limit Reached",
      message: `You've reached your limit of ${getTierConfig(current).limits.representatives} authorised representatives. Upgrade to ${suggestedConfig.name} to add more.`,
      currentTier: current,
      suggestedTier: suggested,
      benefits: [
        `Up to ${isUnlimited(getLimitValue(suggestedConfig.limits.representatives)) ? "unlimited" : suggestedConfig.limits.representatives} authorised representatives`,
        ...suggestedConfig.features,
      ],
    }),

    emergencyContacts: (current, suggested) => ({
      title: "Emergency Contact Limit Reached",
      message: `You've reached your limit of ${getTierConfig(current).limits.emergencyContacts} emergency contacts. Upgrade to ${suggestedConfig.name} to add more.`,
      currentTier: current,
      suggestedTier: suggested,
      benefits: [
        `Up to ${isUnlimited(getLimitValue(suggestedConfig.limits.emergencyContacts)) ? "unlimited" : suggestedConfig.limits.emergencyContacts} emergency contacts`,
        ...suggestedConfig.features,
      ],
    }),

    storageGB: (current, suggested) => ({
      title: "Storage Limit Reached",
      message: `You've reached your storage limit of ${getTierConfig(current).limits.storageGB}GB. Upgrade to ${suggestedConfig.name} for more storage.`,
      currentTier: current,
      suggestedTier: suggested,
      benefits: [
        `${isUnlimited(getLimitValue(suggestedConfig.limits.storageGB)) ? "Unlimited" : suggestedConfig.limits.storageGB + "GB"} storage`,
        ...suggestedConfig.features,
      ],
    }),

    documentsCount: (current, suggested) => ({
      title: "Document Limit Reached",
      message: `You've reached your limit of ${getTierConfig(current).limits.documentsCount} documents. Upgrade to ${suggestedConfig.name} to store more.`,
      currentTier: current,
      suggestedTier: suggested,
      benefits: [
        `Up to ${isUnlimited(getLimitValue(suggestedConfig.limits.documentsCount)) ? "unlimited" : suggestedConfig.limits.documentsCount} documents`,
        ...suggestedConfig.features,
      ],
    }),
  };

  return prompts[limitType](currentTier, suggestedTier);
};

// Utility to format limit display
const formatLimitDisplay = (current: number, limit: number | -1): string => {
  if (limit === -1) return `${current} (unlimited)`;
  return `${current} / ${limit}`;
};

// Utility to get limit status color
const getLimitStatusColor = (
  current: number,
  limit: number | -1
): "green" | "yellow" | "red" => {
  if (limit === -1) return "green";

  const percentage = current / limit;
  if (percentage >= 1) return "red";
  if (percentage >= 0.8) return "yellow";
  return "green";
};

// Pre-defined limit messages for UI
const LIMIT_MESSAGES = {
  representatives: {
    approaching: (remaining: number) =>
      `You have ${remaining} representative slot${remaining === 1 ? "" : "s"} remaining.`,
    reached: "You have reached your authorised representative limit.",
    unlimited: "You have unlimited authorised representatives.",
  },
  emergencyContacts: {
    approaching: (remaining: number) =>
      `You have ${remaining} emergency contact slot${remaining === 1 ? "" : "s"} remaining.`,
    reached: "You have reached your emergency contact limit.",
    unlimited: "You have unlimited emergency contacts.",
  },
} as const;

// Export everything needed for implementation
export {
  checkSubscriptionLimit,
  getSuggestedUpgradeTier,
  generateUpgradePrompt,
  formatLimitDisplay,
  getLimitStatusColor,
  LIMIT_MESSAGES,
  isUnlimited,
  getLimitValue,
};
