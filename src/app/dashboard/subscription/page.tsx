"use client";

import { useUserSubscription } from "@/app/utils/repo_services/hooks/user_subscription";
import { useAppConfig } from "@/app/utils/repo_services/hooks/app_config";
import {
  SUBSCRIPTION_TIERS,
  SubscriptionLevel,
  formatSubscriptionStatus,
  getDaysUntilExpiry,
} from "@/app/utils/repo_services/interfaces/user_subscription";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Crown, Star, Zap, Shield } from "lucide-react";
import { useState } from "react";
import { 
  createPayPalSubscription, 
  activatePayPalSubscription, 
  getPlanPricing,
  getSubscriptionDescription,
  getBillingMessage 
} from "@/services/paypalSubscriptionService";
import { useUserSession } from "@/app/utils/repo_services/hooks/useUserSession";

const getTierIcon = (level: SubscriptionLevel) => {
  switch (level) {
    case "bronze":
      return <Shield className="h-5 w-5 text-amber-600" />;
    case "silver":
      return <Star className="h-5 w-5 text-gray-400" />;
    case "gold":
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case "platinum":
      return <Zap className="h-5 w-5 text-purple-500" />;
    default:
      return <Shield className="h-5 w-5" />;
  }
};

const getTierColor = (level: SubscriptionLevel) => {
  switch (level) {
    case "bronze":
      return "bg-amber-50 border-amber-200 text-amber-800";
    case "silver":
      return "bg-gray-50 border-gray-200 text-gray-800";
    case "gold":
      return "bg-yellow-50 border-yellow-200 text-yellow-800";
    case "platinum":
      return "bg-purple-50 border-purple-200 text-purple-800";
    default:
      return "bg-gray-50 border-gray-200 text-gray-800";
  }
};

export default function SubscriptionPage() {
  const {
    getCurrentSubscription,
    getSubscriptionLevel,
    getSubscriptionInfo,
    hasActiveSubscription,
    isExpiringSoon,
    upgradeSubscription,
    cancelSubscription,
    loading: subscriptionLoading,
    error: subscriptionError,
  } = useUserSubscription();

  const { appConfig, loading: configLoading, error: configError } = useAppConfig();
  const { user } = useUserSession();

  const [showAllPlans, setShowAllPlans] = useState(false);
  const [upgrading, setUpgrading] = useState<SubscriptionLevel | null>(null);

  const handleUpgrade = async (newLevel: SubscriptionLevel) => {
    if (!user?.id) {
      console.error("User not authenticated");
      return;
    }

    // Check if trying to upgrade to premium plan when PayPal is disabled
    const isPremiumPlan = newLevel === 'silver' || newLevel === 'gold' || newLevel === 'platinum';
    if (isPremiumPlan && !appConfig?.paypal_enabled) {
      console.error("Cannot upgrade to premium plan: PayPal is not enabled");
      return;
    }

    if (newLevel === "bronze") {
      setUpgrading("bronze");
      const result = await cancelSubscription();
      if (result.success) {
        console.log("Downgraded to Bronze");
      } else {
        console.error("Failed to downgrade:", result.error);
      }
      setUpgrading(null);
      return;
    }

    try {
      setUpgrading(newLevel);
      
      // Get the plan pricing (use new subscription service)
      const planPrice = getPlanPricing(newLevel);
      
      if (planPrice === 0) {
        // Free plan - handle directly without PayPal
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30 days for free trial
        
        const result = await upgradeSubscription(newLevel, endDate.toISOString());
        if (result.success) {
          console.log(`Upgraded to ${newLevel}`);
        } else {
          console.error("Failed to upgrade:", result.error);
        }
      } else {
        // Paid plan - use new PayPal Subscription API
        console.log(`Creating PayPal subscription for ${newLevel} plan - $${planPrice}/year`);
        console.log(`Billing: ${getBillingMessage(newLevel)}`);
        
        // Create PayPal subscription (NEW API)
        const paypalSubscription = await createPayPalSubscription(newLevel, user.id);
        
        console.log("PayPal subscription created:", paypalSubscription);
        
        // Store the subscription details for when user returns from PayPal
        localStorage.setItem('pendingUpgrade', JSON.stringify({
          level: newLevel,
          subscriptionId: paypalSubscription.subscriptionId,
          userId: user.id,
          type: 'subscription' // Mark as new subscription flow
        }));
        
        // Redirect to PayPal for subscription approval
        if (paypalSubscription.approvalUrl) {
          window.location.href = paypalSubscription.approvalUrl;
        } else {
          throw new Error("PayPal approval URL is missing.");
        }
      }
    } catch (error) {
      console.error("Failed to process upgrade:", error);
      alert("Failed to process upgrade. Please try again.");
    } finally {
      setUpgrading(null);
    }
  };

  // Show loading state while data is being fetched
  if (subscriptionLoading || configLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="flex justify-between items-center">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>

          {/* Current subscription card skeleton */}
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
                <div>
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-8 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subscriptionError || configError) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to load subscription
          </h2>
          <p className="text-gray-600">{subscriptionError || configError || 'An error occurred'}</p>
        </div>
      </div>
    );
  }

  // Only get subscription data after loading is complete
  const currentSubscription = getCurrentSubscription();
  const currentLevel = getSubscriptionLevel();
  const currentInfo = getSubscriptionInfo();
  const isActive = hasActiveSubscription();
  const expiringSoon = isExpiringSoon();
  const daysUntilExpiry = currentSubscription
    ? getDaysUntilExpiry(currentSubscription)
    : null;

  // If still no level data (shouldn't happen after loading), show loading
  if (!currentLevel) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="flex justify-between items-center">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>

          {/* Current subscription card skeleton */}
          <div className="border-2 border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
                <div>
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-8 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
          <p className="text-gray-600 mt-1">
            Manage your subscription and billing
          </p>
        </div>
        <Button
          variant={showAllPlans ? "outline" : "default"}
          onClick={() => setShowAllPlans(!showAllPlans)}
        >
          {showAllPlans ? "Hide Plans" : "View All Plans"}
        </Button>
      </div>

      {/* Current Subscription Card */}
      <Card className={`${getTierColor(currentLevel)} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTierIcon(currentLevel)}
              <div>
                <CardTitle className="text-xl">
                  {currentInfo.name} Plan
                  {!isActive && (
                    <Badge variant="destructive" className="ml-2">
                      Inactive
                    </Badge>
                  )}
                  {expiringSoon && (
                    <Badge variant="outline" className="ml-2">
                      Expiring Soon
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-sm opacity-75">
                  {currentInfo.description}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {currentInfo.price === 0 ? "Free" : `$${currentInfo.price}`}
                {currentInfo.price > 0 && (
                  <span className="text-sm font-normal">
                    {currentLevel === 'silver' ? '/year' : 
                     currentLevel === 'gold' ? '/year (5-year commitment)' :
                     currentLevel === 'platinum' ? '/year (10-year commitment)' : '/month'}
                  </span>
                )}
              </div>
              <div className="text-sm opacity-75">
                Status:{" "}
                {formatSubscriptionStatus(currentSubscription || ({} as any))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Subscription Details */}
            <div>
              <h4 className="font-semibold mb-3">Subscription Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Level:</span>
                  <span className="font-medium capitalize">{currentLevel}</span>
                </div>
                {currentSubscription?.subscription_start_date && (
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span>
                      {new Date(
                        currentSubscription.subscription_start_date
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {daysUntilExpiry !== null && (
                  <div className="flex justify-between">
                    <span>
                      {daysUntilExpiry > 0 ? "Expires in:" : "Expired:"}
                    </span>
                    <span
                      className={
                        daysUntilExpiry <= 7 ? "text-red-600 font-medium" : ""
                      }
                    >
                      {daysUntilExpiry > 0
                        ? `${daysUntilExpiry} days`
                        : `${Math.abs(daysUntilExpiry)} days ago`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Current Features */}
            <div>
              <h4 className="font-semibold mb-3">Your Features</h4>
              <ul className="space-y-1 text-sm">
                {currentInfo.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {currentInfo.features.length > 4 && (
                  <li className="text-gray-600">
                    +{currentInfo.features.length - 4} more features
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Usage Alerts */}
          {expiringSoon && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Your subscription expires in {daysUntilExpiry} days. Consider
                renewing to avoid service interruption.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Plans Section */}
      {showAllPlans && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              All Subscription Plans
            </h2>
            <p className="text-gray-600 mt-1">
              All paid plans use annual billing. Gold and Platinum plans offer locked-in rates with multi-year commitments.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {(
              Object.entries(SUBSCRIPTION_TIERS) as [
                SubscriptionLevel,
                typeof SUBSCRIPTION_TIERS.bronze,
              ][]
            ).map(([level, config]) => {
              const isCurrentPlan = level === currentLevel;
              const isUpgradingThis = upgrading === level;
              // Disable silver, gold, platinum plans if PayPal is disabled
              const isPremiumPlan = level !== 'bronze';
              const isPaypalEnabled = appConfig?.paypal_enabled === true;
              const isPremiumDisabled = isPremiumPlan && !isPaypalEnabled;

              return (
                <Card
                  key={level}
                  className={`relative ${isCurrentPlan ? "ring-2 ring-blue-500" : ""} overflow-hidden flex flex-col h-full`}
                >
                  {/* Discount Ribbon */}
                  {config.save > 0 && (
                    <div className="absolute top-4 -right-8 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold py-1 px-8 transform rotate-45 shadow-lg z-10">
                      Save ${config.save}
                    </div>
                  )}

                  <CardHeader className={`text-center pb-4 pt-6`}>
                    <div className="flex justify-center mb-3">
                      {getTierIcon(level)}
                    </div>
                    <CardTitle className="capitalize text-xl mb-2">
                      {config.name}
                    </CardTitle>
                    <CardDescription className="text-sm mb-4">
                      {config.description}
                    </CardDescription>
                    <div className="text-3xl font-bold">
                      {config.price === 0 ? "Free" : `$${config.price}`}
                      {config.price > 0 && (
                        <span className="text-sm font-normal text-gray-500">
                          /{level === 'silver' ? 'year' : 
                            level === 'gold' ? 'year (5-year plan)' :
                            level === 'platinum' ? 'year (10-year plan)' : config.duration}
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col h-full">
                    <ul className="space-y-3 text-sm flex-grow mb-6">
                      {config.features.slice(0, 5).map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full mt-auto"
                      variant={isCurrentPlan ? "outline" : "default"}
                      disabled={isCurrentPlan || isUpgradingThis || isPremiumDisabled}
                      onClick={() => handleUpgrade(level)}
                    >
                      {isUpgradingThis
                        ? "Processing..."
                        : isCurrentPlan
                          ? "Current Plan"
                          : isPremiumDisabled
                            ? "Payment method not available"
                            : level === "bronze"
                              ? "Downgrade to Free"
                              : `Upgrade to ${config.name}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!showAllPlans && currentLevel !== "platinum" && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Experience</CardTitle>
            <CardDescription>
              Get more features and higher limits with annual billing plans. Gold and Platinum offer locked-in rates for long-term savings.
            </CardDescription>
            {!appConfig?.paypal_enabled && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                Premium upgrades are unavailable as of the moment. Please try again later.
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {currentLevel === "bronze" && appConfig?.paypal_enabled && (
                <>
                  <Button 
                    onClick={() => handleUpgrade("silver")}
                    disabled={!appConfig?.paypal_enabled}
                    variant="default"
                  >
                    {!appConfig?.paypal_enabled 
                      ? "Payment method not available" 
                      : "Upgrade to Silver - $29/year"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpgrade("gold")}
                    disabled={!appConfig?.paypal_enabled}
                  >
                    {!appConfig?.paypal_enabled 
                      ? "Payment method not available" 
                      : "Go Premium - $99.99 (5-year access)"}
                  </Button>
                </>
              )}
              {currentLevel === "silver" && appConfig?.paypal_enabled && (
                <Button 
                  onClick={() => handleUpgrade("gold")}
                  disabled={!appConfig?.paypal_enabled}
                >
                  {!appConfig?.paypal_enabled 
                    ? "Payment method not available" 
                    : "Upgrade to Gold - $99.99 (5-year access)"}
                </Button>
              )}
              {currentLevel === "gold" && appConfig?.paypal_enabled && (
                <Button 
                  onClick={() => handleUpgrade("platinum")}
                  disabled={!appConfig?.paypal_enabled}
                >
                  {!appConfig?.paypal_enabled 
                    ? "Payment method not available" 
                    : "Upgrade to Platinum - $199.99 (10-year access)"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
