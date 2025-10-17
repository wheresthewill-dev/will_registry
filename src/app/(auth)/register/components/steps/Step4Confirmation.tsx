import React, { useEffect, useState } from "react";
import { useRegistrationStore } from "@/stores/formStore";
import StepNavigationWrapper from "../form/StepNavigationWrapper";
import { formatCurrency } from "@/services/paypalSubscriptionService";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  CreditCard,
  CheckCircle2,
  InfoIcon,
  Clock,
  Check,
} from "lucide-react";
import { PAYPAL_LOGO_PATH } from "@/app/constants/image-paths";
import { cn } from "@/lib/utils";

interface SubscriptionDetails {
  planLevel: string;
  planName: string;
  price: number;
  billingCycle: string;
  subscriptionId?: string;
  startDate: string;
  nextBillingDate?: string;
  endDate?: string;
  paymentMethod: string;
  currency: string;
  features: string[];
}

export default function Step4Confirmation() {
  const { userProfile, subscriptionPlan } = useRegistrationStore.getState();
  const [subscriptionDetails, setSubscriptionDetails] =
    useState<SubscriptionDetails | null>(null);

  // Format dates for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Get plan display name
  const getPlanDisplayName = (planLevel: string) => {
    const planNames = {
      bronze: "Bronze Plan",
      silver: "Silver Plan",
      gold: "Gold Plan (5-Year)",
      platinum: "Platinum Plan (10-Year)",
    };
    return planNames[planLevel as keyof typeof planNames] || planLevel;
  };

  // Get billing cycle description
  const getBillingCycleText = (planLevel: string) => {
    const cycles = {
      bronze: "Free (No billing)",
      silver: "Annual billing",
      gold: "Annual billing for 5 years",
      platinum: "Annual billing for 10 years",
    };
    return cycles[planLevel as keyof typeof cycles] || "Annual";
  };

  // Get plan badge color
  const getPlanBadgeColor = (planLevel: string) => {
    const colors = {
      bronze: "bg-amber-100 text-amber-800 hover:bg-amber-100",
      silver: "bg-slate-100 text-slate-800 hover:bg-slate-100",
      gold: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      platinum: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
    };
    return (
      colors[planLevel as keyof typeof colors] ||
      "bg-gray-100 text-gray-800 hover:bg-gray-100"
    );
  };

  // Get plan features
  const getPlanFeatures = (planLevel: string) => {
    const features = {
      bronze: [
        "Basic access to platform",
        "Community support",
        "Standard features",
        "Email support",
      ],
      silver: [
        "All Bronze features",
        "Premium support",
        "Advanced analytics",
        "Priority customer service",
        "Extended storage",
      ],
      gold: [
        "All Silver features",
        "5-year commitment savings",
        "Dedicated account manager",
        "Custom integrations",
        "Advanced reporting",
      ],
      platinum: [
        "All Gold features",
        "10-year commitment maximum savings",
        "White-label options",
        "Custom development support",
        "24/7 premium support",
      ],
    };
    return features[planLevel as keyof typeof features] || [];
  };

  // Get plan pricing
  const getPlanPricing = (planLevel: string) => {
    const pricing = {
      bronze: 0,
      silver: 29,
      gold: 19.8,
      platinum: 19.9,
    };
    return pricing[planLevel as keyof typeof pricing] || 0;
  };

  // Load subscription details
  useEffect(() => {
    try {
      // Check for paid plan subscription first
      const pendingUpgradeStr = localStorage.getItem("pendingUpgrade");
      let planLevel = subscriptionPlan || "bronze"; // Default to bronze if no plan selected
      let hasPaymentDetails = false;
      let subscriptionId: string | undefined;

      if (pendingUpgradeStr) {
        const pendingUpgrade = JSON.parse(pendingUpgradeStr);
        if (pendingUpgrade && pendingUpgrade.activationAttempted) {
          planLevel = pendingUpgrade.level;
          hasPaymentDetails = true;
          subscriptionId = pendingUpgrade.subscriptionId;
        }
      }

      // Get today as start date
      const today = new Date();

      // Calculate next billing date (1 year from today) for paid plans
      let nextBillingDate;
      let endDate;

      if (planLevel !== "bronze") {
        nextBillingDate = new Date(today);
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);

        // Calculate end date based on plan
        if (planLevel === "gold") {
          endDate = new Date(today);
          endDate.setFullYear(endDate.getFullYear() + 5);
        } else if (planLevel === "platinum") {
          endDate = new Date(today);
          endDate.setFullYear(endDate.getFullYear() + 10);
        }
      }

      setSubscriptionDetails({
        planLevel,
        planName: getPlanDisplayName(planLevel),
        price: getPlanPricing(planLevel),
        billingCycle: getBillingCycleText(planLevel),
        subscriptionId: hasPaymentDetails ? subscriptionId : undefined,
        startDate: today.toISOString(),
        nextBillingDate: nextBillingDate?.toISOString(),
        endDate: endDate?.toISOString(),
        paymentMethod: planLevel === "bronze" ? "Free Plan" : "PayPal",
        currency: "USD",
        features: getPlanFeatures(planLevel),
      });
    } catch (e) {
      console.error("Failed to parse subscription details:", e);
      // Fallback to Bronze plan
      const today = new Date();
      setSubscriptionDetails({
        planLevel: "bronze",
        planName: getPlanDisplayName("bronze"),
        price: 0,
        billingCycle: getBillingCycleText("bronze"),
        startDate: today.toISOString(),
        paymentMethod: "Free Plan",
        currency: "USD",
        features: getPlanFeatures("bronze"),
      });
    }
  }, [subscriptionPlan]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-2 bg-green-50 rounded-full mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Registration Successful!
        </h2>
        <p className="text-foreground/80 text-base md:text-lg max-w-md mx-auto">
          Your activation link is sent to{" "}
          <span className="font-semibold text-foreground">
            {userProfile.email}
          </span>
          .
          <br />
          Please check your email to activate your account.
        </p>
      </div>

      {subscriptionDetails && (
        <Card className="my-8 border shadow-lg rounded-xl overflow-hidden max-w-xl mx-auto transform transition-all hover:shadow-xl">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-6 px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
              <div>
                <h3 className="text-xl font-bold">
                  {subscriptionDetails.planLevel === "bronze"
                    ? "Plan Selected"
                    : "Subscription Receipt"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {subscriptionDetails.planLevel === "bronze"
                    ? "Your selected plan details"
                    : "Thank you for your subscription!"}
                </p>
              </div>
              <Badge
                variant="outline"
                className="self-start md:self-center px-3 py-1.5 text-xs rounded-lg border border-primary/20"
              >
                {format(new Date(), "yyyy-MM-dd HH:mm:ss")}
              </Badge>
            </div>
          </div>

          <CardContent className="pt-6 px-6">
            <div className="space-y-6">
              <div className="flex flex-col gap-y-5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex items-center">
                    <InfoIcon className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Plan Type
                    </span>
                  </div>
                  <Badge
                    className={cn(
                      "font-medium text-xs px-3 py-1",
                      getPlanBadgeColor(subscriptionDetails.planLevel)
                    )}
                  >
                    {subscriptionDetails.planName}
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {subscriptionDetails.planLevel === "bronze"
                        ? "Cost"
                        : "Annual Cost"}
                    </span>
                  </div>
                  <span className="font-semibold">
                    {subscriptionDetails.planLevel === "bronze"
                      ? "Free"
                      : formatCurrency(
                          subscriptionDetails.price,
                          subscriptionDetails.currency
                        )}
                    {subscriptionDetails.planLevel !== "bronze" && (
                      <span className="text-muted-foreground text-xs ml-1">
                        per year
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Billing Frequency
                    </span>
                  </div>
                  <span>{subscriptionDetails.billingCycle}</span>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Plan Features Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                  Included Features
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {subscriptionDetails.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {subscriptionDetails.subscriptionId && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs uppercase text-muted-foreground mb-1">
                          Subscription ID
                        </span>
                        <div className="font-mono text-xs bg-muted/30 p-2 rounded overflow-x-auto">
                          {subscriptionDetails.subscriptionId}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs uppercase text-muted-foreground mb-1">
                          Payment Method
                        </span>
                        <div className="flex items-center">
                          {subscriptionDetails.planLevel === "bronze" ? (
                            <span className="text-sm">Free Plan</span>
                          ) : (
                            <div className="bg-white rounded p-1 shadow-sm mr-2">
                              <img
                                src={PAYPAL_LOGO_PATH}
                                alt="PayPal Logo"
                                className="h-6"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                      <div className="bg-muted/20 p-3 rounded-lg">
                        <div className="flex items-center mb-2">
                          <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                          <span className="text-xs uppercase text-muted-foreground">
                            Start Date
                          </span>
                        </div>
                        <p className="text-sm font-medium">
                          {formatDate(subscriptionDetails.startDate)}
                        </p>
                      </div>

                      {subscriptionDetails.nextBillingDate && (
                        <div className="bg-muted/20 p-3 rounded-lg">
                          <div className="flex items-center mb-2">
                            <CalendarIcon className="h-4 w-4 mr-2 text-amber-500" />
                            <span className="text-xs uppercase text-muted-foreground">
                              Next Billing
                            </span>
                          </div>
                          <p className="text-sm font-medium">
                            {formatDate(subscriptionDetails.nextBillingDate)}
                          </p>
                        </div>
                      )}

                      {subscriptionDetails.endDate && (
                        <div className="bg-muted/20 p-3 rounded-lg">
                          <div className="flex items-center mb-2">
                            <CalendarIcon className="h-4 w-4 mr-2 text-red-500" />
                            <span className="text-xs uppercase text-muted-foreground">
                              End Date
                            </span>
                          </div>
                          <p className="text-sm font-medium">
                            {formatDate(subscriptionDetails.endDate)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>

          <CardFooter className="px-6 py-4 bg-muted/10 border-t">
            <div className="w-full text-center">
              <p className="text-sm text-muted-foreground">
                {subscriptionDetails.planLevel === "bronze"
                  ? "Your account has been set up with the Bronze plan. Check your email to activate your account."
                  : "A confirmation email with subscription details has been sent to your inbox."}
              </p>
              <div className="mt-4">
                <StepNavigationWrapper />
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
