// User Subscription Interface
// Matches the user_subscription table structure

export type SubscriptionLevel = "bronze" | "silver" | "gold" | "platinum";

export interface UserSubscription {
  id: string;
  user_id: number;
  subscription_level: SubscriptionLevel;
  subscription_start_date: string; // ISO timestamp
  subscription_end_date: string | null; // ISO timestamp or null for bronze
  is_active: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Subscription tier configuration with updated annual billing prices
export const SUBSCRIPTION_TIERS = {
  bronze: {
    name: "Bronze",
    description: "Safe and simple will storage for everyone.",
    price: 0,
    save: 0,
    duration: null, // Perpetual
    is_recurring: false,
    features: [
      "1 Authorised Representative",
      "1 Emergency Contact",
      "Secure and private access",
    ],
    limits: {
      emergencyContacts: 2,
      representatives: 1,
      storageGB: 0.005, // 5MB
      documentsCount: 10,
    },
  },
  silver: {
    name: "Silver",
    description: "Annual plan with complete alert system and premium features.",
    price: 29.99,
    save: 0.0,
    duration: "per year",
    is_recurring: true,
    features: [
      "Up to 12 Authorised Representatives",
      "Up to 6 emergency contacts",
      "Alert System",
      "Annual billing - cancel anytime",
    ],
    limits: {
      emergencyContacts: 6,
      representatives: 12,
      storageGB: 0.1, // 100MB
      documentsCount: 50,
    },
  },
  gold: {
    name: "Gold",
    description: "5-year access plan with locked-in rate and premium perks.",
    price: 99.99,
    save: 45.05, // Save compared to 5 years of Silver: (29*5) - 99.99 = $45.05
    duration: "every 5 years",
    is_recurring: true,
    features: [
      "All Silver features",
      "5-year access with one-time payment",
      "No recurring billing",
      "Free copy of Janet's book",
      "Premium support included",
    ],
    limits: {
      emergencyContacts: 6,
      representatives: 12,
      storageGB: 1,
      documentsCount: 200,
    },
  },
  platinum: {
    name: "Platinum",
    description:
      "10-year access plan with maximum protection and premium benefits.",
    price: 199.99,
    save: 90.01, // Save compared to 10 years of Silver: (29*10) - 199.99 = $90.01
    duration: "every 10 years",
    is_recurring: true,
    features: [
      "All Gold features",
      "10-year access with one-time payment",
      "No recurring billing",
      "Free will review",
      "Maximum long-term protection",
    ],
    limits: {
      emergencyContacts: 6,
      representatives: 12,
      storageGB: 20,
      documentsCount: -1, // Unlimited
    },
  },
} as const;

// Utility functions for subscription management
export const isFreeTier = (level: SubscriptionLevel): boolean =>
  level === "bronze";

export const isPaidTier = (level: SubscriptionLevel): boolean =>
  level !== "bronze";

export const getTierConfig = (level: SubscriptionLevel) =>
  SUBSCRIPTION_TIERS[level];

export const isFeatureAvailable = (
  userLevel: SubscriptionLevel,
  requiredLevel: SubscriptionLevel
): boolean => {
  const levels: SubscriptionLevel[] = ["bronze", "silver", "gold", "platinum"];
  const userIndex = levels.indexOf(userLevel);
  const requiredIndex = levels.indexOf(requiredLevel);
  return userIndex >= requiredIndex;
};

export const checkLimit = (
  userLevel: SubscriptionLevel,
  limitType: keyof typeof SUBSCRIPTION_TIERS.bronze.limits,
  currentUsage: number
): { allowed: boolean; limit: number | -1; overLimit: boolean } => {
  const config = getTierConfig(userLevel);
  const limit = config.limits[limitType];

  return {
    allowed: limit === -1 || currentUsage < limit,
    limit,
    overLimit: limit !== -1 && currentUsage >= limit,
  };
};

// New function to check if user can add new items based on their current usage
export const canAddNewItem = (
  userLevel: SubscriptionLevel,
  limitType: keyof typeof SUBSCRIPTION_TIERS.bronze.limits,
  currentUsage: number
): boolean => {
  const config = getTierConfig(userLevel);
  const limit = config.limits[limitType];

  // If limit is -1 (unlimited), always allow
  if (limit === -1) return true;

  // Check if current usage is under the limit
  return currentUsage < limit;
};

// Check if user is over limits for any resource type
export const getOverLimitViolations = (
  userLevel: SubscriptionLevel,
  currentUsage: {
    emergencyContacts?: number;
    representatives?: number;
    documents?: number;
    storageGB?: number;
  }
): Array<{
  type: string;
  current: number;
  limit: number;
  violation: string;
}> => {
  const config = getTierConfig(userLevel);
  const violations: Array<{
    type: string;
    current: number;
    limit: number;
    violation: string;
  }> = [];

  // Check emergency contacts
  if (currentUsage.emergencyContacts !== undefined) {
    const ecLimit = config.limits.emergencyContacts;
    if (
      typeof ecLimit === "number" &&
      currentUsage.emergencyContacts > ecLimit
    ) {
      violations.push({
        type: "emergencyContacts",
        current: currentUsage.emergencyContacts,
        limit: ecLimit,
        violation: `Emergency Contacts: ${currentUsage.emergencyContacts}/${ecLimit} (over limit)`,
      });
    }
  }

  // Check representatives
  if (currentUsage.representatives !== undefined) {
    const repLimit = config.limits.representatives;
    if (
      typeof repLimit === "number" &&
      currentUsage.representatives > repLimit
    ) {
      violations.push({
        type: "representatives",
        current: currentUsage.representatives,
        limit: repLimit,
        violation: `Authorised Representatives: ${currentUsage.representatives}/${repLimit} (over limit)`,
      });
    }
  }

  // Check documents
  if (currentUsage.documents !== undefined) {
    const docsLimit = config.limits.documentsCount;
    if (
      typeof docsLimit === "number" &&
      docsLimit !== -1 &&
      currentUsage.documents > docsLimit
    ) {
      violations.push({
        type: "documents",
        current: currentUsage.documents,
        limit: docsLimit,
        violation: `Documents: ${currentUsage.documents}/${docsLimit} (over limit)`,
      });
    }
  }

  // Check storage
  if (currentUsage.storageGB !== undefined) {
    const storageLimit = config.limits.storageGB;
    if (
      typeof storageLimit === "number" &&
      currentUsage.storageGB > storageLimit
    ) {
      violations.push({
        type: "storage",
        current: currentUsage.storageGB,
        limit: storageLimit,
        violation: `Storage: ${currentUsage.storageGB}GB/${storageLimit}GB (over limit)`,
      });
    }
  }

  return violations;
};

// Check if user has any over-limit violations
export const hasOverLimitViolations = (
  userLevel: SubscriptionLevel,
  currentUsage: {
    emergencyContacts?: number;
    representatives?: number;
    documents?: number;
    storageGB?: number;
  }
): boolean => {
  return getOverLimitViolations(userLevel, currentUsage).length > 0;
};

export const isSubscriptionActive = (
  subscription: UserSubscription
): boolean => {
  if (!subscription.is_active) return false;

  // Bronze tier is always active
  if (subscription.subscription_level === "bronze") return true;

  // Paid tiers check end date
  if (!subscription.subscription_end_date) return false;

  const endDate = new Date(subscription.subscription_end_date);
  return endDate > new Date();
};

export const getDaysUntilExpiry = (
  subscription: UserSubscription
): number | null => {
  if (subscription.subscription_level === "bronze") return null;
  if (!subscription.subscription_end_date) return null;

  const endDate = new Date(subscription.subscription_end_date);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

export const formatSubscriptionStatus = (
  subscription: UserSubscription
): string => {
  if (!isSubscriptionActive(subscription)) {
    return "Expired";
  }

  const daysUntilExpiry = getDaysUntilExpiry(subscription);

  if (daysUntilExpiry === null) {
    return "Active (Free)";
  }

  if (daysUntilExpiry <= 0) {
    return "Expired";
  }

  if (daysUntilExpiry <= 7) {
    return `Expires in ${daysUntilExpiry} days`;
  }

  return "Active";
};

// Validation functions
export const validateSubscriptionLevel = (
  level: string
): level is SubscriptionLevel => {
  return ["bronze", "silver", "gold", "platinum"].includes(level);
};

export const validateSubscription = (
  subscription: Partial<UserSubscription>
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!subscription.user_id) {
    errors.push("User ID is required");
  }

  if (!subscription.subscription_level) {
    errors.push("Subscription level is required");
  } else if (!validateSubscriptionLevel(subscription.subscription_level)) {
    errors.push("Invalid subscription level");
  }

  if (
    subscription.subscription_level !== "bronze" &&
    !subscription.subscription_end_date
  ) {
    errors.push("Paid subscriptions must have an end date");
  }

  if (subscription.subscription_end_date) {
    const endDate = new Date(subscription.subscription_end_date);
    const startDate = new Date(
      subscription.subscription_start_date || new Date()
    );

    if (endDate <= startDate) {
      errors.push("End date must be after start date");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
