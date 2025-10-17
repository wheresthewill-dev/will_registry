"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionLevel } from "@/app/utils/repo_services/interfaces/user_subscription";
import { useRouter } from "next/navigation";

// Define constants to follow DRY principle
const DISPLAY_NAMES = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

const DESCRIPTIONS = {
  bronze: "Safe and simple will storage for everyone.",
  silver: "Annual plan with complete alert system and premium features.",
  gold: "5-year commitment plan with locked-in annual rate and premium perks.",
  platinum:
    "10-year commitment plan with maximum protection and premium benefits.",
};

interface SubscriptionTierProps {
  level: SubscriptionLevel;
  config: {
    name: string;
    description: string;
    price: number;
    save: number;
    duration: string | null;
    features: string[];
    limits: {
      emergencyContacts: number;
      representatives: number;
      storageGB: number;
      documentsCount: number;
    };
  };
  currentLevel?: SubscriptionLevel;
  isProcessing?: boolean;
  onSelect?: (level: SubscriptionLevel) => void;
  useUpgradeButton?: boolean;
  showCurrentPlanBanner?: boolean;
  isClickable?: boolean;
  selected?: boolean;
  useGetStartedButton?: boolean;
  isRecommended?: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
}

// Custom SVG icons for each tier with responsive sizing
const TierIcon: React.FC<{ tier: SubscriptionLevel; iconColor: string }> = ({
  tier,
  iconColor,
}) => {
  // Responsive icon sizes that scale with viewport
  const iconClasses = "w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24";

  const icons = {
    bronze: (
      <svg viewBox="0 0 100 100" className={`${iconClasses} ${iconColor}`}>
        <rect x="25" y="25" width="50" height="50" fill="currentColor" />
        <rect x="35" y="35" width="30" height="30" fill="white" />
        <line
          x1="25"
          y1="25"
          x2="75"
          y2="25"
          stroke="currentColor"
          strokeWidth="6"
        />
        <line
          x1="25"
          y1="50"
          x2="75"
          y2="50"
          stroke="currentColor"
          strokeWidth="3"
        />
        <line
          x1="25"
          y1="75"
          x2="75"
          y2="75"
          stroke="currentColor"
          strokeWidth="6"
        />
      </svg>
    ),
    silver: (
      <svg viewBox="0 0 100 100" className={`${iconClasses} ${iconColor}`}>
        <polygon
          points="25,45 50,25 75,45 75,70 50,90 25,70"
          fill="currentColor"
        />
        <polygon
          points="50,25 75,45 50,65 25,45"
          fill="white"
          stroke="currentColor"
          strokeWidth="1"
        />
        <polygon
          points="75,45 75,70 50,90 50,65"
          fill="white"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.7"
        />
        <polygon
          points="25,45 50,65 50,90 25,70"
          fill="white"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>
    ),
    gold: (
      <svg viewBox="0 0 100 100" className={`${iconClasses} ${iconColor}`}>
        <polygon points="25,50 50,30 75,50 50,70" fill="currentColor" />
        <polygon
          points="25,40 50,20 75,40 50,60"
          fill="currentColor"
          opacity="0.7"
        />
        <polygon
          points="25,60 50,40 75,60 50,80"
          fill="currentColor"
          opacity="0.4"
        />
        <polygon
          points="50,30 75,50 50,70 25,50"
          fill="none"
          stroke="white"
          strokeWidth="1"
        />
      </svg>
    ),
    platinum: (
      <svg viewBox="0 0 100 100" className={`${iconClasses} ${iconColor}`}>
        <rect
          x="35"
          y="35"
          width="30"
          height="30"
          transform="rotate(45 50 50)"
          fill="currentColor"
        />
        <line x1="50" y1="20" x2="50" y2="80" stroke="white" strokeWidth="2" />
        <line x1="20" y1="50" x2="80" y2="50" stroke="white" strokeWidth="2" />
        <line x1="32" y1="32" x2="68" y2="68" stroke="white" strokeWidth="2" />
        <line x1="32" y1="68" x2="68" y2="32" stroke="white" strokeWidth="2" />
      </svg>
    ),
  };

  return icons[tier] || icons.bronze;
};

// Helper functions to follow DRY principle
const getBackgroundColor = (level: SubscriptionLevel) => {
  const backgrounds = {
    bronze: "bg-amber-50",
    silver: "bg-slate-50",
    gold: "bg-yellow-50",
    platinum: "bg-blue-50",
  };
  return backgrounds[level] || backgrounds.bronze;
};

const getIconColor = (level: SubscriptionLevel) => {
  const colors = {
    bronze: "text-amber-600",
    silver: "text-slate-500",
    gold: "text-yellow-600",
    platinum: "text-blue-600",
  };
  return colors[level] || colors.bronze;
};

const getAccentColor = (level: SubscriptionLevel) => {
  const colors = {
    bronze: "bg-amber-500 text-white",
    silver: "bg-slate-500 text-white",
    gold: "bg-yellow-500 text-white",
    platinum: "bg-blue-500 text-white",
  };
  return colors[level] || colors.bronze;
};

export const SubscriptionTierCard: React.FC<SubscriptionTierProps> = ({
  level,
  config,
  currentLevel,
  isProcessing = false,
  onSelect,
  useUpgradeButton = false,
  showCurrentPlanBanner = false,
  isClickable = true,
  selected = false,
  useGetStartedButton = false,
  isRecommended = false,
  isDisabled = false,
  disabledReason,
}) => {
  const isCurrentPlan = level === currentLevel;
  const isUpgradingThis = isProcessing;
  const router = useRouter();

  // Get styling properties using helper functions
  const backgroundColor = getBackgroundColor(level);
  const iconColor = getIconColor(level);
  const accentColor = getAccentColor(level);
  const borderColor = selected ? "border-gray-400" : "border-gray-200";

  const handleCardClick = () => {
    if (isClickable && onSelect) {
      onSelect(level);
    }
  };

  const handleStartRegistration = () => {
    if (onSelect) {
      onSelect(level);
    }
    router.push("/register");
  };

  // Use description from constants or fallback to config
  const description = DESCRIPTIONS[level] || config.description;

  // Format price display
  const formatPrice = () => {
    if (config.price === 0) return "0";
    return config.price.toString();
  };

  // Format commitment period if applicable
  const getCommitmentPeriod = () => {
    if (level === "bronze") return "";
    if (level === "silver") return "/per year";
    if (level === "gold") return "/every 5 years";
    if (level === "platinum") return "/every 10 years";
    return config.duration ? `/every ${config.duration} years` : "";
  };

  return (
    <Card
      onClick={isClickable ? handleCardClick : undefined}
      className={cn(
        "relative flex flex-col h-full transition-all duration-200",
        "border",
        borderColor,
        isClickable && !isDisabled && "cursor-pointer",
        isCurrentPlan && "ring-2 ring-black",
        selected && "ring-1 ring-gray-400",
        isDisabled && "opacity-70"
      )}
    >
      {/* Current plan or recommended banner */}
      {(showCurrentPlanBanner && isCurrentPlan) || isRecommended ? (
        <div
          className={cn(
            "absolute inset-x-0 top-0 py-1.5 text-white text-xs font-semibold text-center uppercase tracking-wider",
            isRecommended ? "bg-accent-foreground" : "bg-gray-700"
          )}
        >
          {isRecommended ? "Recommended" : "Current Plan"}
        </div>
      ) : isDisabled ? (
        <div
          className={cn(
            "absolute inset-x-0 top-0 py-1.5 text-white text-xs font-semibold text-center uppercase tracking-wider",
            "bg-gray-500"
          )}
        >
          {disabledReason || "Currently Unavailable"}
        </div>
      ) : (
        config.save > 0 && (
          <div
            className={cn(
              "absolute inset-x-0 top-0 py-1.5 text-white text-sm font-semibold text-center uppercase tracking-wider rounded-tr-xl rounded-tl-xl",
              "bg-accent-foreground"
            )}
          >
            Save ${config.save} annually
          </div>
        )
      )}

      {/* Selection indicator */}
      {selected && !isCurrentPlan && (
        <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}

      <CardHeader
        className={cn(
          "text-center",
          "pb-2 pt-6",
          (showCurrentPlanBanner && isCurrentPlan) || isRecommended
            ? "pt-10"
            : ""
        )}
      >
        <div className="flex justify-center mb-3">
          <TierIcon tier={level} iconColor={iconColor} />
        </div>

        <CardTitle className="text-xl font-bold mb-1">
          {DISPLAY_NAMES[level] || config.name}
        </CardTitle>

        <CardDescription className="text-sm max-w-[250px] mx-auto min-h-[48px]">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 pb-3 px-6">
        <div className="text-center mb-6 border-b border-gray-200 pb-4">
          <div className=" justify-center">
            <span className="text-lg mr-1">$</span>
            <span className="text-[42px] font-bold tracking-tight">
              {formatPrice()}
            </span>
            <span className="text-gray-600 text-sm">
              {getCommitmentPeriod()}
            </span>
          </div>
        </div>

        {/* Features List */}
        <div className="mb-6">
          <ul className="space-y-3">
            {config.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                  <BadgeCheck
                    className={cn(
                      "w-full h-full object-contain aspect-square",
                      getIconColor(level)
                    )}
                  />
                </div>
                <span className="text-sm leading-5 text-left flex-1 pt-0.5">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="px-6 pt-0 pb-6 mt-auto">
        {useUpgradeButton ? (
          <Button
            className={cn(
              "w-full font-medium",
              isCurrentPlan
                ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                : isDisabled
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-gray-900 hover:bg-gray-800 text-white"
            )}
            size="lg"
            disabled={isCurrentPlan || isUpgradingThis || isDisabled}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelect && !isDisabled) onSelect(level);
            }}
          >
            {isUpgradingThis
              ? "Processing..."
              : isCurrentPlan
                ? "Current Plan"
                : isDisabled
                  ? "Unavailable"
                  : `Select ${DISPLAY_NAMES[level]}`}
          </Button>
        ) : useGetStartedButton ? (
          <Button
            onClick={handleStartRegistration}
            className={cn(
              "w-full font-medium",
              isDisabled
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-gray-900 hover:bg-gray-800 text-white"
            )}
            disabled={isDisabled}
            size="lg"
          >
            {isDisabled ? "Unavailable" : "Get Started"}
          </Button>
        ) : null}
      </CardFooter>
      {/* Legal text */}
      <p className="text-xs text-gray-500 w-full text-center mt-3">
        {level !== "bronze"
          ? "Secure payment. Cancel anytime."
          : "No credit card required."}
      </p>
    </Card>
  );
};
