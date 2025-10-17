/**
 * PayPal Subscription Service
 * New implementation using PayPal Subscriptions API for recurring and multi-year billing
 * This replaces the old order-based payment system
 */

export type PaymentSource = "registration" | "subscription";

export interface PayPalPlan {
  planLevel: string;
  paypalPlanId: string;
  name: string;
  price: number;
  billingInterval: string;
  intervalCount: number;
  yearsCovered?: number; // For multi-year plans
  isRecurring: boolean;
}

export interface PayPalSubscription {
  success: boolean;
  subscriptionId?: string;
  approvalUrl?: string;
  planLevel?: string;
  status?: string;
  billingInfo?: {
    interval: string;
    intervalCount: number;
    yearsCovered: number;
    isRecurring: boolean;
    nextBillingDate?: string;
    endDate?: string;
  };
  message?: string;
  error?: string;
  suggestion?: string;
  source?: PaymentSource;
}

export interface PayPalActivationResult {
  success: boolean;
  subscriptionId?: string;
  planLevel?: string;
  status?: string;
  nextBillingDate?: string;
  endDate?: string;
  error?: string;
  code?: string;
  suggestion?: string;
}

// Plan configuration mapping
export const PAYPAL_PLAN_CONFIG: Record<string, PayPalPlan> = {
  silver: {
    planLevel: "silver",
    paypalPlanId:
      process.env.NEXT_PUBLIC_PAYPAL_SILVER_PLAN_ID || "P-SILVER-PLAN-ID",
    name: "Silver Plan",
    price: 29.99,
    billingInterval: "YEAR",
    intervalCount: 1,
    isRecurring: true, // Renews annually forever
  },
  gold: {
    planLevel: "gold",
    paypalPlanId:
      process.env.NEXT_PUBLIC_PAYPAL_GOLD_PLAN_ID || "P-GOLD-PLAN-ID",
    name: "Gold Plan",
    price: 99.99, // One-time payment for 5-year access
    billingInterval: "ONE_TIME",
    intervalCount: 1,
    yearsCovered: 5, // 5-year access
    isRecurring: false, // One-time payment
  },
  platinum: {
    planLevel: "platinum",
    paypalPlanId:
      process.env.NEXT_PUBLIC_PAYPAL_PLATINUM_PLAN_ID || "P-PLATINUM-PLAN-ID",
    name: "Platinum Plan",
    price: 199.99, // One-time payment for 10-year access
    billingInterval: "ONE_TIME",
    intervalCount: 1,
    yearsCovered: 10, // 10-year access
    isRecurring: false, // One-time payment
  },
};

// Detect if the current page is part of the registration flow
export function detectPaymentSource(): PaymentSource {
  if (typeof window === "undefined") return "subscription";
  return window.location.pathname.includes("/register")
    ? "registration"
    : "subscription";
}

// Get return URL based on source
export function getReturnUrl(source: PaymentSource): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  if (source === "registration") {
    return `${baseUrl}/register?payment=success&step=confirmation`;
  }
  return `${baseUrl}/dashboard/subscription/success`;
}

// Get cancel URL based on source
export function getCancelUrl(source: PaymentSource): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  if (source === "registration") {
    return `${baseUrl}/register`;
  }
  return `${baseUrl}/dashboard/subscription/cancel`;
}

// Create PayPal subscription with explicit URLs
export async function createPayPalSubscription(
  planLevel: string,
  userId: string,
  options?: {
    source?: PaymentSource;
    customReturnUrl?: string;
    customCancelUrl?: string;
  }
): Promise<PayPalSubscription> {
  try {
    // Determine the source - use provided value or detect automatically
    const source = options?.source || detectPaymentSource();

    // Use custom URLs if provided, otherwise use defaults based on source
    const returnUrl = options?.customReturnUrl || getReturnUrl(source);
    const cancelUrl = options?.customCancelUrl || getCancelUrl(source);

    console.log(
      `🔄 Creating PayPal payment for ${planLevel} plan, user: ${userId}, source: ${source}`
    );
    console.log(`Return URL: ${returnUrl}`);
    console.log(`Cancel URL: ${cancelUrl}`);

    // Check if this is a one-time payment (Gold/Platinum) or subscription (Silver)
    const planConfig = PAYPAL_PLAN_CONFIG[planLevel.toLowerCase()];
    const isOneTime = planConfig && planConfig.billingInterval === "ONE_TIME";

    if (isOneTime) {
      // Use PayPal Orders API for one-time payments (Gold & Platinum)
      const response = await fetch("/api/payments/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planLevel,
          userId,
          source,
          returnUrl,
          cancelUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ PayPal order HTTP error:", {
          status: response.status,
          data,
        });
        return {
          success: false,
          error: data.error || "Failed to create PayPal order",
          suggestion: data.suggestion || "Please try again",
          source,
        };
      }

      if (!data.success) {
        console.error("❌ PayPal order creation failed:", data);
        return {
          success: false,
          error: data.error || "PayPal order creation failed",
          suggestion: data.suggestion || "Please try again",
          source,
        };
      }

      console.log("✅ PayPal order created successfully:", data);
      return {
        success: true,
        subscriptionId: data.orderId, // Use orderId as subscriptionId for compatibility
        approvalUrl: data.approvalUrl,
        planLevel: data.planLevel,
        status: data.status,
        billingInfo: {
          interval: "ONE_TIME",
          intervalCount: 1,
          yearsCovered: planConfig.yearsCovered || 1,
          isRecurring: false,
        },
        message: data.message,
        source: data.source || source,
      };
    } else {
      // Use PayPal Subscriptions API for recurring payments (Silver)
      const response = await fetch("/api/payments/paypal/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planLevel,
          userId,
          source,
          returnUrl,
          cancelUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ PayPal subscription HTTP error:", {
          status: response.status,
          data,
        });
        return {
          success: false,
          error: data.error || "Failed to create PayPal subscription",
          suggestion: data.suggestion || "Please try again",
          source,
        };
      }

      if (!data.success) {
        console.error("❌ PayPal subscription creation failed:", data);
        return {
          success: false,
          error: data.error || "PayPal subscription creation failed",
          suggestion: data.suggestion || "Please try again",
          source,
        };
      }

      console.log("✅ PayPal subscription created successfully:", data);
      return {
        success: true,
        subscriptionId: data.subscriptionId,
        approvalUrl: data.approvalUrl,
        planLevel: data.planLevel,
        status: data.status,
        billingInfo: data.billingInfo,
        message: data.message,
        source: data.source || source,
      };
    }
  } catch (error) {
    console.error("❌ Create PayPal payment failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
      suggestion: "Please check your connection and try again",
    };
  }
}

// Activate PayPal subscription or capture order based on ID format
// This function intelligently handles both:
// - Subscription IDs (I-XXXXXX format) for Silver recurring billing 
// - Order IDs (other formats) for Gold/Platinum one-time payments
export async function activatePayPalSubscription(
  subscriptionOrOrderId: string,
  userId: string
): Promise<PayPalActivationResult> {
  try {
    console.log(
      `🔄 Processing PayPal payment: ${subscriptionOrOrderId} for user: ${userId}`
    );

    // Detect if this is a subscription ID or order ID based on format
    // PayPal subscription IDs start with "I-" (e.g., I-BW452GLLEP1G)
    // PayPal order IDs have different format (e.g., 64G13319VP4382027)
    const isSubscriptionId = subscriptionOrOrderId.startsWith("I-");
    
    if (isSubscriptionId) {
      // Handle subscription activation (Silver plan)
      console.log(`📋 Detected subscription ID, using subscription API`);
      
      const response = await fetch("/api/payments/paypal/activate-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscriptionOrOrderId, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ PayPal subscription activation HTTP error:", {
          status: response.status,
          data,
        });
        return {
          success: false,
          error: data.error || "Failed to activate PayPal subscription",
          code: data.code,
          suggestion: data.suggestion,
        };
      }

      if (!data.success) {
        console.error("❌ PayPal subscription activation failed:", data);
        return {
          success: false,
          error: data.error || "PayPal subscription activation failed",
          code: data.code,
          suggestion: data.suggestion,
        };
      }

      console.log("✅ PayPal subscription activated successfully:", data);
      return {
        success: true,
        subscriptionId: data.subscriptionId,
        planLevel: data.planLevel,
        status: data.status,
        nextBillingDate: data.nextBillingDate,
        endDate: data.endDate,
      };
    } else {
      // Handle order capture (Gold/Platinum plans)
      console.log(`📋 Detected order ID, using order capture API`);
      
      const response = await fetch("/api/payments/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: subscriptionOrOrderId, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ PayPal order capture HTTP error:", {
          status: response.status,
          data,
        });
        return {
          success: false,
          error: data.error || "Failed to capture PayPal order",
          code: data.code,
          suggestion: data.suggestion,
        };
      }

      if (!data.success) {
        console.error("❌ PayPal order capture failed:", data);
        return {
          success: false,
          error: data.error || "PayPal order capture failed",
          code: data.code,
          suggestion: data.suggestion,
        };
      }

      console.log("✅ PayPal order captured successfully:", data);
      return {
        success: true,
        subscriptionId: data.transactionId, // Use transaction ID as subscription ID for compatibility
        planLevel: data.plan,
        status: 'ACTIVE',
        nextBillingDate: undefined, // One-time payments don't have next billing date
        endDate: data.subscriptionEndDate,
      };
    }
  } catch (error) {
    console.error("❌ PayPal payment processing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
      suggestion: "Please check your connection and try again",
    };
  }
}

// Get plan pricing (maintains compatibility with existing code)
export function getPlanPricing(plan: string): number {
  const config = PAYPAL_PLAN_CONFIG[plan.toLowerCase()];
  if (config) {
    return config.price;
  }

  // Fallback to new pricing for bronze
  const pricing: Record<string, number> = {
    bronze: 0,
    silver: 29,
    gold: 99.99, // One-time payment for 5-year access
    platinum: 199.99, // One-time payment for 10-year access
  };

  return pricing[plan.toLowerCase()] || 0;
}

// Get subscription description
export function getSubscriptionDescription(planLevel: string): string {
  const descriptions: Record<string, string> = {
    bronze: "Free forever",
    silver: "Annual billing - cancel anytime",
    gold: "One-time payment - 5-year access",
    platinum: "One-time payment - 10-year access",
  };

  return descriptions[planLevel.toLowerCase()] || "";
}

// Get billing message
export function getBillingMessage(planLevel: string): string {
  const messages: Record<string, string> = {
    bronze: "No payment required",
    silver: "Billed annually at $29/year (cancel anytime)",
    gold: "One-time payment: $99.99 for 5-year access",
    platinum: "One-time payment: $199.99 for 10-year access",
  };

  return messages[planLevel.toLowerCase()] || "";
}

// Format currency (maintains compatibility)
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

// Open PayPal checkout (maintains compatibility)
export function openPayPalCheckout(approvalUrl: string): void {
  // Open PayPal in a new window
  const popup = window.open(
    approvalUrl,
    "paypal-checkout",
    "width=600,height=700,scrollbars=yes,resizable=yes"
  );

  if (!popup) {
    // Fallback: redirect in the same window
    window.location.href = approvalUrl;
  }
}

// Upgrade subscription with proper PayPal handling
export async function upgradePayPalSubscription(
  currentPlan: string,
  newPlan: string,
  userId: string
): Promise<{
  success: boolean;
  strategy?: string;
  message?: string;
  nextStep?: string;
  prorationCredit?: number;
  approvalUrl?: string;
  subscriptionId?: string;
  error?: string;
}> {
  try {
    console.log(
      `🔄 Upgrading subscription from ${currentPlan} to ${newPlan} for user ${userId}`
    );

    // Step 1: Analyze upgrade strategy
    const upgradeResponse = await fetch(
      "/api/payments/paypal/upgrade-subscription",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentPlan,
          newPlan,
        }),
      }
    );

    if (!upgradeResponse.ok) {
      const errorData = await upgradeResponse.json();
      throw new Error(errorData.error || "Upgrade analysis failed");
    }

    const upgradeData = await upgradeResponse.json();
    console.log("Upgrade strategy:", upgradeData);

    // Step 2: Execute upgrade strategy
    if (upgradeData.nextStep === "create-new-subscription") {
      // Create new subscription for the target plan
      console.log(`Creating new ${newPlan} subscription...`);

      const source = detectPaymentSource();
      const subscriptionResult = await createPayPalSubscription(
        newPlan,
        userId,
        { source }
      );

      if (!subscriptionResult.success) {
        throw new Error(
          subscriptionResult.error || "Failed to create new subscription"
        );
      }

      return {
        success: true,
        strategy: upgradeData.strategy,
        message: upgradeData.message,
        prorationCredit: upgradeData.prorationCredit,
        approvalUrl: subscriptionResult.approvalUrl,
        subscriptionId: subscriptionResult.subscriptionId,
      };
    }

    // For 'continue' strategy (Silver to Silver)
    return {
      success: true,
      strategy: upgradeData.strategy,
      message: upgradeData.message,
      prorationCredit: upgradeData.prorationCredit,
    };
  } catch (error) {
    console.error("❌ Upgrade PayPal subscription failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
}

// Downgrade subscription with limit checking
export async function downgradePayPalSubscription(
  currentPlan: string,
  newPlan: string,
  userId: string
): Promise<{
  success: boolean;
  strategy?: string;
  message?: string;
  nextStep?: string;
  hasViolations?: boolean;
  violations?: string[];
  potentialRefund?: number;
  restrictionMessage?: string;
  approvalUrl?: string;
  subscriptionId?: string;
  error?: string;
}> {
  try {
    console.log(
      `🔄 Analyzing downgrade from ${currentPlan} to ${newPlan} for user ${userId}`
    );

    // Step 1: Analyze downgrade feasibility and restrictions
    const downgradeResponse = await fetch(
      "/api/payments/paypal/downgrade-subscription",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentPlan,
          newPlan,
        }),
      }
    );

    if (!downgradeResponse.ok) {
      const errorData = await downgradeResponse.json();
      throw new Error(errorData.error || "Downgrade analysis failed");
    }

    const downgradeData = await downgradeResponse.json();
    console.log("Downgrade analysis:", downgradeData);

    const analysis = downgradeData.downgradeAnalysis;

    // Return analysis for user confirmation
    if (downgradeData.nextStep === 'confirm-with-restrictions' || 
        downgradeData.nextStep === 'proceed-with-downgrade') {
      
      return {
        success: true,
        strategy: analysis.strategy,
        message: analysis.message,
        nextStep: downgradeData.nextStep,
        hasViolations: analysis.hasViolations,
        violations: analysis.violations,
        potentialRefund: analysis.potentialRefund,
        restrictionMessage: analysis.restrictionMessage,
      };
    }

    // If Bronze downgrade is complete
    if (downgradeData.nextStep === 'downgrade-complete') {
      return {
        success: true,
        strategy: 'downgrade-to-free',
        message: downgradeData.message,
        nextStep: 'complete',
      };
    }

    // If we need to create a new subscription for paid plan
    if (downgradeData.nextStep === 'create-new-subscription') {
      console.log(`Creating new ${newPlan} subscription after downgrade...`);

      const source = detectPaymentSource();
      const subscriptionResult = await createPayPalSubscription(
        newPlan,
        userId,
        { source }
      );

      if (!subscriptionResult.success) {
        throw new Error(
          subscriptionResult.error || "Failed to create new subscription"
        );
      }

      return {
        success: true,
        strategy: 'downgrade-and-create-new',
        message: `Downgraded from ${currentPlan}. Complete payment for ${newPlan} plan.`,
        nextStep: 'payment-required',
        approvalUrl: subscriptionResult.approvalUrl,
        subscriptionId: subscriptionResult.subscriptionId,
        potentialRefund: analysis.potentialRefund,
      };
    }

    return {
      success: false,
      error: 'Unexpected downgrade response',
    };

  } catch (error) {
    console.error("❌ Downgrade PayPal subscription failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
}

// Confirm downgrade with restrictions (user accepted the limitations)
export async function confirmDowngradeWithRestrictions(
  currentPlan: string,
  newPlan: string,
  userId: string
): Promise<{
  success: boolean;
  message?: string;
  nextStep?: string;
  approvalUrl?: string;
  subscriptionId?: string;
  error?: string;
}> {
  try {
    console.log(
      `🔄 Confirming downgrade with restrictions from ${currentPlan} to ${newPlan} for user ${userId}`
    );

    const confirmResponse = await fetch(
      "/api/payments/paypal/downgrade-subscription",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentPlan,
          newPlan,
          confirmDowngrade: true,
        }),
      }
    );

    if (!confirmResponse.ok) {
      const errorData = await confirmResponse.json();
      throw new Error(errorData.error || "Downgrade confirmation failed");
    }

    const confirmData = await confirmResponse.json();
    console.log("Downgrade confirmation:", confirmData);

    // If Bronze downgrade is complete
    if (confirmData.nextStep === 'downgrade-complete') {
      return {
        success: true,
        message: confirmData.message,
        nextStep: 'complete',
      };
    }

    // If we need to create a new subscription for paid plan
    if (confirmData.nextStep === 'create-new-subscription') {
      const source = detectPaymentSource();
      const subscriptionResult = await createPayPalSubscription(
        newPlan,
        userId,
        { source }
      );

      if (!subscriptionResult.success) {
        throw new Error(
          subscriptionResult.error || "Failed to create new subscription"
        );
      }

      return {
        success: true,
        message: `Downgrade confirmed. Complete payment for ${newPlan} plan.`,
        nextStep: 'payment-required',
        approvalUrl: subscriptionResult.approvalUrl,
        subscriptionId: subscriptionResult.subscriptionId,
      };
    }

    return {
      success: true,
      message: confirmData.message,
      nextStep: confirmData.nextStep,
    };

  } catch (error) {
    console.error("❌ Confirm downgrade failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
}
