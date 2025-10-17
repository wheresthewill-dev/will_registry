"use client";

import React, { useState } from "react";

import {
  SUBSCRIPTION_TIERS,
  SubscriptionLevel,
} from "@/app/utils/repo_services/interfaces/user_subscription";
import { SubscriptionTierCard } from "./subscription-card";

import { AppConfig } from "@/app/utils/repo_services/interfaces/app_config";

interface SubscriptionTiersGridProps {
  currentLevel?: SubscriptionLevel;
  onUpgrade?: (level: SubscriptionLevel) => Promise<void>;
  useUpgradeButton?: boolean;
  showCurrentPlanBanner?: boolean;
  isCardClickable?: boolean;
  singleSelection?: boolean;
  onSelectionChange?: (selected: SubscriptionLevel[]) => void;
  defaultSelected?: SubscriptionLevel[];
  useGetStartedButton?: boolean;
  appConfig?: AppConfig | null;
}

export const SubscriptionTiersGrid: React.FC<SubscriptionTiersGridProps> = ({
  currentLevel,
  onUpgrade,
  useGetStartedButton = false,
  useUpgradeButton = false,
  showCurrentPlanBanner = false,
  isCardClickable = true,
  singleSelection = true,
  onSelectionChange,
  defaultSelected = [],
  appConfig = null,
}) => {
  const [upgrading, setUpgrading] = useState<SubscriptionLevel | null>(null);
  const [selectedTiers, setSelectedTiers] = useState<SubscriptionLevel[]>(
    defaultSelected.length > 0
      ? defaultSelected
      : currentLevel
        ? [currentLevel]
        : []
  );

  const handleSelect = async (level: SubscriptionLevel) => {
    // Handle card selection
    if (isCardClickable) {
      let newSelection: SubscriptionLevel[];

      if (singleSelection) {
        // Single selection mode - replace current selection
        newSelection = [level];
      } else {
        // Multiple selection mode - toggle selection
        newSelection = selectedTiers.includes(level)
          ? selectedTiers.filter((tier) => tier !== level) // Remove if selected
          : [...selectedTiers, level]; // Add if not selected
      }

      setSelectedTiers(newSelection);

      // Notify parent component about selection change
      if (onSelectionChange) {
        onSelectionChange(newSelection);
      }
    }

    // Handle upgrade if specified
    if (onUpgrade && useUpgradeButton) {
      setUpgrading(level);
      try {
        await onUpgrade(level);
      } finally {
        setUpgrading(null);
      }
    }
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
      {(
        Object.entries(SUBSCRIPTION_TIERS) as [
          SubscriptionLevel,
          (typeof SUBSCRIPTION_TIERS)[SubscriptionLevel],
        ][]
      ).map(([level, config]) => {
        // Determine if this tier should be disabled
        // Premium tiers (silver, gold, platinum) should be disabled when PayPal is not enabled
        const isPremiumTier = level !== 'bronze';
        const isPaypalEnabled = appConfig?.paypal_enabled === true;
        const isDisabled = isPremiumTier && !isPaypalEnabled;
        
        return (
          <SubscriptionTierCard
            key={level}
            level={level}
            config={{ ...config, features: Array.from(config.features) }}
            currentLevel={currentLevel}
            isProcessing={upgrading === level}
            onSelect={handleSelect}
            useUpgradeButton={useUpgradeButton}
            showCurrentPlanBanner={showCurrentPlanBanner}
            isClickable={isCardClickable && !isDisabled}
            selected={selectedTiers.includes(level)}
            useGetStartedButton={useGetStartedButton}
            isDisabled={isDisabled}
            disabledReason={isDisabled ? "Payment method not available" : undefined}
            // isRecommended={config.name === "Platinum"}
          />
        );
      })}
    </div>
  );
};
