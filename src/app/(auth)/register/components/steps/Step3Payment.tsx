import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRegistrationStore } from "@/stores/formStore";
import { SUBSCRIPTION_TIERS } from "@/app/utils/repo_services/interfaces/user_subscription";
import StepNavigationWrapper from "../form/StepNavigationWrapper";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/services/paypalSubscriptionService";
import {
  CalendarIcon,
  CheckCircle,
  CreditCard,
  Lock,
  Mail,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function StepThree() {
  const { userProfile, subscriptionPlan } = useRegistrationStore.getState();

  const selectedPlanDetails = subscriptionPlan
    ? SUBSCRIPTION_TIERS[subscriptionPlan]
    : null;

  // Get plan badge color
  const getPlanBadgeColor = (planName: string) => {
    const planNameLower = planName.toLowerCase();
    const colors = {
      bronze: "bg-amber-100 text-amber-800",
      silver: "bg-slate-100 text-slate-800",
      gold: "bg-yellow-100 text-yellow-800",
      platinum: "bg-indigo-100 text-indigo-800",
    };
    return (
      colors[planNameLower as keyof typeof colors] ||
      "bg-gray-100 text-gray-800"
    );
  };

  // Format currency
  const formatPrice = (price: number) => {
    return formatCurrency(price, "USD");
  };

  // Get billing cycle text
  const getBillingCycle = (planName: string) => {
    const planNameLower = planName.toLowerCase();
    const cycles = {
      bronze: "Free (No billing)",
      silver: "Annual billing",
      gold: "Annual billing for 5 years",
      platinum: "Annual billing for 10 years",
    };
    return cycles[planNameLower as keyof typeof cycles] || "Annual billing";
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <Card className="border shadow-md rounded-xl px-3">
        <CardHeader>
          <div className="flex flex-col items-center space-y-2">
            <CardTitle className="text-2xl font-bold">
              Payment Overview
            </CardTitle>
            <CardDescription className="text-center">
              Please review your details and proceed to payment
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6 px-6">
          {selectedPlanDetails && (
            <div className="space-y-6">
              {/* Plan Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                  Plan Details
                </h3>

                <div className="bg-muted/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Plan Details Section */}
                  <div className="space-y-3 md:space-y-1 text-left">
                    <p className="text-sm text-muted-foreground">
                      Selected Plan
                    </p>
                    <div className="flex items-center">
                      <Badge
                        className={cn(
                          "mr-2",
                          getPlanBadgeColor(selectedPlanDetails.name)
                        )}
                      >
                        {selectedPlanDetails.name}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {getBillingCycle(selectedPlanDetails.name)}
                    </span>
                  </div>

                  {/* Price Section */}
                  <div className="text-left space-y-3 md:space-y-1 sm:text-right">
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="text-lg font-bold">
                      {formatPrice(selectedPlanDetails.price)}
                    </p>
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {selectedPlanDetails.duration}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Customer Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-primary" />
                  Customer Details
                </h3>

                <div className="bg-muted/20 rounded-lg p-4 space-y-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">
                      {userProfile.firstName} {userProfile.lastName}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Email Address
                    </p>
                    <p className="font-medium">{userProfile.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You will receive your activation link via this email.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Summary Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-primary" />
                  Payment Summary
                </h3>

                <div className="bg-muted/20 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      {selectedPlanDetails.name} Plan
                    </span>
                    <span>{formatPrice(selectedPlanDetails.price)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taxes & Fees</span>
                    <span>{formatPrice(0)}</span>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex justify-between items-center font-bold">
                    <span>Total Payment</span>
                    <span>{formatPrice(selectedPlanDetails.price)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <div className="flex items-start space-x-3 bg-blue-50 p-4 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-800">
                  Secure Payment
                </p>
                <p className="text-xs text-blue-700">
                  You'll be redirected to PayPal to securely complete your
                  payment. No PayPal account needed — you can use a debit or
                  credit card.
                </p>
              </div>
            </div>

            <div className="flex justify-center items-center bg-white rounded-lg shadow-sm border">
              <img
                src="https://www.paypalobjects.com/webstatic/mktg/logo/AM_mc_vs_dc_ae.jpg"
                alt="PayPal and card payment options"
                className="w-56"
              />
            </div>
          </div>
        </CardContent>
        <div className="flex items-center justify-center mb-4 text-xs text-muted-foreground">
          <Lock className="h-3 w-3 mr-1" />
          All transactions are secure and encrypted
        </div>
        <div className="mx-6">
          <StepNavigationWrapper />
        </div>
      </Card>
    </div>
  );
}
