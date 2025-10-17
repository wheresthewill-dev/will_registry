import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRegistrationStep } from "../../hooks/useRegistrationStep";
import { useRegistrationStore } from "@/stores/formStore";
import { toast } from "sonner";
import {
  registerUserServerSide,
  validateUserData,
} from "@/services/serverAuthService";
import { navigationButtonStyle } from "@/app/constants/sizes";
import { LoadingIndicator } from "@/components/custom/LoadingIndicator";
import { createRegistrationData } from "../utils/createRegistrationData";
import { useUserSession } from "@/app/utils/repo_services/hooks/useUserSession";
import {
  SUBSCRIPTION_TIERS,
  SubscriptionLevel,
} from "@/app/utils/repo_services/interfaces/user_subscription";
import {
  getPlanPricing,
  getBillingMessage,
  createPayPalSubscription,
  activatePayPalSubscription,
  detectPaymentSource,
} from "@/services/paypalSubscriptionService";

interface StepNavigationProps {
  form?: any;
}

interface PaymentResult {
  success: boolean;
  error?: string;
  redirected?: boolean;
}

interface RegisteredUserInfo {
  userId: string;
  authUserId: string;
  email: string;
}

interface PendingUpgrade {
  level: SubscriptionLevel;
  subscriptionId: string;
  userId: string;
  authUserId: string;
  type: "subscription" | string;
  source: string;
  requiresLogin?: boolean;
  activationAttempted?: boolean;
}

export default function StepNavigation({ form }: StepNavigationProps) {
  const { currentStep, goToNextStep, goToPreviousStep } = useRegistrationStep();
  const { resetRegistration, subscriptionPlan, userProfile } =
    useRegistrationStore();
  const [loading, setLoading] = React.useState(false);
  const [activatingSubscription, setActivatingSubscription] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user } = useUserSession();

  const [upgrading, setUpgrading] = useState<SubscriptionLevel | null>(null);
  const [activationCompleted, setActivationCompleted] = useState(false);
  const [activationAttempted, setActivationAttempted] = useState(false);

  // Store registration data for payment processing (minimal, non-sensitive)
  const [registeredUser, setRegisteredUser] =
    useState<RegisteredUserInfo | null>(null);

  // Use the centralized flow detection
  const flowSource = useMemo(() => detectPaymentSource(), []);

  // Memoized registration data
  const registrationData = useMemo(
    () => createRegistrationData(userProfile),
    [userProfile]
  );

  const isFinalStep = currentStep === "confirmation";
  const isButtonDisabled = loading || activatingSubscription;

  // Load registered user info from localStorage if available (on mount)
  useEffect(() => {
    const stored = localStorage.getItem("registeredUserInfo");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      setRegisteredUser(parsed as RegisteredUserInfo);
    } catch (e) {
      console.error("Failed to parse stored user info:", e);
    }

    // Also check for a previously completed activation
    const pendingUpgradeStr = localStorage.getItem("pendingUpgrade");
    if (pendingUpgradeStr) {
      try {
        const pendingUpgrade = JSON.parse(pendingUpgradeStr) as PendingUpgrade;
        if (pendingUpgrade.activationAttempted) {
          setActivationAttempted(true);
        }
      } catch (e) {
        console.error("Failed to parse pendingUpgrade:", e);
      }
    }
  }, []);

  // When component mounts or search params change, check for PayPal return
  useEffect(() => {
    // Prevent execution if activation is already attempted or in progress
    if (
      activationAttempted ||
      activatingSubscription ||
      typeof window === "undefined"
    ) {
      return;
    }

    const paymentSuccess = searchParams?.get("payment") === "success";
    const stepParam = searchParams?.get("step");

    if (
      paymentSuccess &&
      flowSource === "registration" &&
      stepParam === "confirmation"
    ) {
      console.log(
        "Payment success detected in URL — processing pending upgrade..."
      );
      (async () => {
        setActivatingSubscription(true);
        let processed = false;

        try {
          // Read the pending upgrade from localStorage
          const pendingUpgradeStr = localStorage.getItem("pendingUpgrade");
          if (!pendingUpgradeStr) {
            console.error("No pending upgrade found in localStorage");
            return;
          }

          const pendingUpgrade = JSON.parse(
            pendingUpgradeStr
          ) as PendingUpgrade;
          console.log("Found pending upgrade:", pendingUpgrade);

          // Skip activation if it's already been attempted
          if (pendingUpgrade.activationAttempted) {
            console.log(
              "Activation already attempted according to stored data"
            );
            processed = true;
            setActivationAttempted(true);
            setActivationCompleted(true);
            return;
          }

          if (!pendingUpgrade.subscriptionId || !pendingUpgrade.authUserId) {
            console.error("Invalid pending upgrade data:", pendingUpgrade);
            return;
          }

          // CHANGE: Directly call activatePayPalSubscription with auth user ID
          const activationResult = await activatePayPalSubscription(
            pendingUpgrade.subscriptionId,
            pendingUpgrade.authUserId // Important: Use auth user ID for activation
          );

          processed = activationResult.success;

          if (processed) {
            // Update state and localStorage to reflect activation
            setActivationCompleted(true);
            setActivationAttempted(true);

            // Update pending upgrade with activation status but don't remove it yet
            pendingUpgrade.activationAttempted = true;
            localStorage.setItem(
              "pendingUpgrade",
              JSON.stringify(pendingUpgrade)
            );
          } else {
            console.error(
              "Subscription activation failed:",
              activationResult.error
            );
            toast.error(
              activationResult.error || "Failed to activate subscription"
            );
          }
        } catch (error) {
          console.error("Error processing payment return:", error);
          toast.error("Failed to process payment return");
        } finally {
          setActivatingSubscription(false);

          // Only advance to confirmation step if activation was processed
          // or if we've already attempted activation before
          if (processed || activationAttempted) {
            // Use a flag to track the advancement to avoid infinite loops
            let isAdvancing = false;

            const advanceToConfirmation = (attempts = 0) => {
              if (attempts > 20 || isAdvancing) return;

              isAdvancing = true;
              if (currentStep !== "confirmation") {
                goToNextStep();
                setTimeout(() => {
                  isAdvancing = false;
                  advanceToConfirmation(attempts + 1);
                }, 100);
              } else {
                // Clean the URL
                const url = new URL(window.location.href);
                url.searchParams.delete("payment");
                url.searchParams.delete("step");
                window.history.replaceState({}, document.title, url.pathname);

                // Only show success message if we haven't already shown one
                if (processed) {
                  toast.success("Payment successful!");
                }

                // Now that we're on confirmation step and everything is done,
                // we can clear the pending upgrade
                localStorage.removeItem("pendingUpgrade");
              }
            };

            advanceToConfirmation();
          } else {
            // If activation failed, still clean URL but show error
            const url = new URL(window.location.href);
            url.searchParams.delete("payment");
            url.searchParams.delete("step");
            window.history.replaceState({}, document.title, url.pathname);

            console.error(
              "Payment was unsuccessful. Your subscription remains on the Bronze (Free) plan. Please try again or contact support for assistance."
            );
          }
        }
      })();
    }
  }, [
    searchParams,
    flowSource,
    currentStep,
    goToNextStep,
    activationAttempted,
    activatingSubscription,
  ]);

  const handlePayment = async (
    newLevel: SubscriptionLevel
  ): Promise<PaymentResult> => {
    // For registration flow, use the stored user ID instead of requiring an authenticated user
    const effectiveUserId =
      flowSource === "registration" && registeredUser
        ? registeredUser.userId
        : user?.id;

    const effectiveAuthUserId =
      flowSource === "registration" && registeredUser
        ? registeredUser.authUserId
        : user?.id;

    if (!effectiveUserId || !effectiveAuthUserId) {
      return {
        success: false,
        error:
          flowSource === "registration"
            ? "Registration information not found. Please restart the registration process."
            : "User not authenticated",
      };
    }

    try {
      setUpgrading(newLevel);
      const planPrice = getPlanPricing(newLevel);

      console.log(
        `Creating PayPal subscription for ${newLevel} plan - $${planPrice}/year`
      );
      console.log(`Billing: ${getBillingMessage(newLevel)}`);
      console.log(`Source flow: ${flowSource}`);
      console.log(
        `User ID: ${effectiveUserId}, Auth ID: ${effectiveAuthUserId}`
      );

      // Create PayPal subscription with source information
      const paypalSubscription = await createPayPalSubscription(
        newLevel,
        effectiveUserId,
        { source: flowSource }
      );

      if (!paypalSubscription || !paypalSubscription.subscriptionId) {
        throw new Error(
          "PayPal subscription creation failed — no subscription id."
        );
      }

      // Store the subscription details for when user returns from PayPal
      const pending: PendingUpgrade = {
        level: newLevel,
        subscriptionId: paypalSubscription.subscriptionId,
        userId: effectiveUserId,
        authUserId: effectiveAuthUserId,
        type: "subscription",
        source: flowSource,
        requiresLogin: flowSource === "registration",
        activationAttempted: false,
      };

      localStorage.setItem("pendingUpgrade", JSON.stringify(pending));

      // Redirect to PayPal for approval
      if (paypalSubscription.approvalUrl) {
        window.location.href = paypalSubscription.approvalUrl;
        return { success: true, redirected: true };
      } else {
        throw new Error("PayPal approval URL is missing.");
      }
    } catch (error: any) {
      console.error("Failed to process upgrade:", error);
      return {
        success: false,
        error: error?.message || "Failed to process upgrade. Please try again.",
      };
    } finally {
      setUpgrading(null);
    }
  };
  const [isValidationPerformed, setIsValidationPerformed] = useState(false);

  const onValid = async (data: any) => {
    setLoading(true);
    try {
      if (currentStep === "profile") {
        const validationResult = await validateUserData(registrationData);

        if (isValidationPerformed) {
          setIsValidationPerformed(true);
          return;
        }
        if (!validationResult.success) {
          toast.error(validationResult.error);
          return;
        }

        // Register user without auto-login
        const registrationResult = await registerUserServerSide(
          registrationData,
          { skipAutoLogin: true }
        );

        if (!registrationResult.success) {
          toast.error(registrationResult.error);
          return;
        }
        const userInfo: RegisteredUserInfo = {
          userId: registrationResult.userId!,
          authUserId: registrationResult.authUserId!,
          email: registrationData.email,
        };

        setRegisteredUser(userInfo);
        localStorage.setItem("registeredUserInfo", JSON.stringify(userInfo));

        goToNextStep();
      } else if (currentStep === "payment") {
        const selectedPlanDetails = subscriptionPlan
          ? SUBSCRIPTION_TIERS[subscriptionPlan]
          : null;
        try {
          if (!selectedPlanDetails) {
            toast.error("No subscription plan selected");
            return;
          }

          const paymentResult = await handlePayment(
            selectedPlanDetails.name as SubscriptionLevel
          );

          if (paymentResult.success) {
            if (!paymentResult.redirected) {
              // If PayPal was not needed or approval returned immediately
              goToNextStep();
            } else if (flowSource === "registration") {
              // we redirect to PayPal; on return, the useEffect will handle processing
              console.log(
                "Payment initiated from registration - awaiting PayPal return"
              );
            }
          } else {
            toast.error(
              paymentResult.error || "Payment failed. Please try again."
            );
          }
        } catch (error: any) {
          console.error("Error during payment processing:", error);
          toast.error("An unexpected error occurred during payment.");
        }
      } else if (isFinalStep) {
        try {
          // After successful verification (handled on PayPal return), we let user login.
          // Show different message based on activation status
          if (activationCompleted) {
            toast.success(
              "Your subscription is active. Please log in to access your account."
            );
          }

          // Clear stored registration data
          localStorage.removeItem("registeredUserInfo");
          setRegisteredUser(null);

          resetRegistration();
          router.push("/login");
        } catch (err) {
          console.error("Navigation error:", err);
          toast.error("Failed to navigate to login");
        }
      } else {
        goToNextStep();
      }
    } catch (err: any) {
      console.error("Processing error:", err);
      toast.error(
        "An unexpected error occurred: " + (err.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = (errors: any) => {
    setLoading(false);
    console.error("Form validation errors:", errors);
    toast.error("Please fill up the required fields.");
  };

  const handleContinue = () => {
    if (form && currentStep === "profile") {
      form.handleSubmit(onValid, onInvalid)();
    } else {
      onValid({});
    }
  };

  return (
    <div className="flex justify-between mb-3">
      {currentStep !== "profile" && !isFinalStep && (
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={isButtonDisabled}
        >
          Back
        </Button>
      )}

      <div
        className={cn(
          currentStep === "profile" || isFinalStep ? "mx-auto" : ""
        )}
      >
        <Button
          className={cn(
            currentStep !== "profile"
              ? navigationButtonStyle.sm
              : navigationButtonStyle.lg,
            isButtonDisabled && currentStep === "subscription"
              ? "opacity-60 cursor-not-allowed"
              : ""
          )}
          onClick={handleContinue}
          disabled={isButtonDisabled}
        >
          {loading || activatingSubscription ? (
            <LoadingIndicator text="Processing..." />
          ) : isFinalStep ? (
            "Proceed to Login"
          ) : currentStep === "payment" ? (
            "Proceed to Payment"
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
