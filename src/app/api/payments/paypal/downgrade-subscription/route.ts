/**
 * PayPal Subscription Downgrade API Route
 * Handles subscription downgrades with proper limit checking and enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/utils/supabase/admin";
import {
  SUBSCRIPTION_TIERS,
  SubscriptionLevel,
} from "@/app/utils/repo_services/interfaces/user_subscription";

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL!;

// Create Supabase admin client
const supabaseAdmin = createAdminClient();

// Get PayPal access token
async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get PayPal access token");
  }

  const data = await response.json();
  return data.access_token;
}

// Cancel PayPal subscription
async function cancelPayPalSubscription(
  accessToken: string,
  subscriptionId: string,
  reason: string
) {
  const response = await fetch(
    `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        reason: reason,
      }),
    }
  );

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text();
    console.warn(`PayPal subscription cancellation failed: ${errorText}`);
    // Don't throw error - we can still proceed with downgrade even if PayPal cancellation fails
  }

  return { success: response.ok || response.status === 204 };
}

// Get user's current subscription
async function getCurrentSubscription(userId: string) {
  const { data: subscription, error } = await supabaseAdmin
    .from("user_subscription")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    // Not found is OK
    throw new Error(`Failed to get current subscription: ${error.message}`);
  }

  return subscription;
}

// Get user's current usage counts
async function getCurrentUsage(userId: string) {
  // Get emergency contacts count
  const { data: emergencyContacts, error: ecError } = await supabaseAdmin
    .from("user_emergency_contacts")
    .select("id")
    .eq("user_id", userId);

  if (ecError) {
    throw new Error(
      `Failed to get emergency contacts count: ${ecError.message}`
    );
  }

  // Get authorised representatives count
  const { data: representatives, error: repError } = await supabaseAdmin
    .from("user_authorized_representatives")
    .select("id")
    .eq("user_id", userId);

  if (repError) {
    throw new Error(`Failed to get representatives count: ${repError.message}`);
  }

  // Get documents count (if we have a documents table)
  const { data: documents, error: docsError } = await supabaseAdmin
    .from("document_locations")
    .select("id")
    .eq("user_id", userId);

  // Documents table might not exist yet, so don't throw error
  const documentsCount = docsError ? 0 : documents?.length || 0;

  return {
    emergencyContacts: emergencyContacts?.length || 0,
    representatives: representatives?.length || 0,
    documents: documentsCount,
    // Storage calculation would go here if we track it
    storageUsed: 0,
  };
}

// Check if user is over limits for target plan
function checkLimitViolations(usage: any, targetPlan: SubscriptionLevel) {
  const targetLimits = SUBSCRIPTION_TIERS[targetPlan].limits;
  const violations: string[] = [];

  // Check emergency contacts limit
  const ecLimit = targetLimits.emergencyContacts;
  if (
    typeof ecLimit === "number" &&
    ecLimit > 0 &&
    usage.emergencyContacts > ecLimit
  ) {
    violations.push(
      `Emergency Contacts: ${usage.emergencyContacts}/${ecLimit} (over limit)`
    );
  }

  // Check representatives limit
  const repLimit = targetLimits.representatives;
  if (
    typeof repLimit === "number" &&
    repLimit > 0 &&
    usage.representatives > repLimit
  ) {
    violations.push(
      `Authorised Representatives: ${usage.representatives}/${repLimit} (over limit)`
    );
  }

  // Check documents limit
  const docsLimit = targetLimits.documentsCount;
  if (
    typeof docsLimit === "number" &&
    docsLimit !== -1 &&
    usage.documents > docsLimit
  ) {
    violations.push(`Documents: ${usage.documents}/${docsLimit} (over limit)`);
  }

  return violations;
}

// Calculate potential refund (for future wallet credits)
function calculatePotentialRefund(subscription: any): number {
  if (!subscription || !subscription.subscription_end_date) return 0;

  const now = new Date();
  const endDate = new Date(subscription.subscription_end_date);
  const startDate = new Date(subscription.subscription_start_date);

  if (endDate <= now) return 0; // Already expired

  const totalDays =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const unusedDays =
    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const usagePercentage = unusedDays / totalDays;

  // Calculate refund based on current plan pricing
  const currentTier =
    SUBSCRIPTION_TIERS[subscription.subscription_level as SubscriptionLevel];
  const annualPrice = currentTier.price;

  if (usagePercentage > 0.1) {
    // Only refund if >10% unused
    return Math.round(annualPrice * usagePercentage * 100) / 100; // Round to 2 decimals
  }

  return 0;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, currentPlan, newPlan } = await request.json();

    if (!userId || !currentPlan || !newPlan) {
      return NextResponse.json(
        { error: "Missing required parameters: userId, currentPlan, newPlan" },
        { status: 400 }
      );
    }

    // Validate that this is actually a downgrade
    const planHierarchy: SubscriptionLevel[] = [
      "bronze",
      "silver",
      "gold",
      "platinum",
    ];
    const currentIndex = planHierarchy.indexOf(
      currentPlan as SubscriptionLevel
    );
    const newIndex = planHierarchy.indexOf(newPlan as SubscriptionLevel);

    if (currentIndex === -1 || newIndex === -1) {
      return NextResponse.json(
        { error: "Invalid plan level specified" },
        { status: 400 }
      );
    }

    if (newIndex >= currentIndex) {
      return NextResponse.json(
        {
          error:
            "This is not a downgrade. Use upgrade endpoint for upgrades or same-plan changes.",
        },
        { status: 400 }
      );
    }

    // Get current subscription and usage
    const currentSubscription = await getCurrentSubscription(userId);
    if (!currentSubscription) {
      return NextResponse.json(
        { error: "No active subscription found to downgrade" },
        { status: 404 }
      );
    }

    const currentUsage = await getCurrentUsage(userId);

    // Check for limit violations
    const violations = checkLimitViolations(
      currentUsage,
      newPlan as SubscriptionLevel
    );

    // Calculate potential refund for future wallet credits
    const potentialRefund = calculatePotentialRefund(currentSubscription);

    // Prepare response with current state and violations
    const response: any = {
      success: true,
      downgradeAnalysis: {
        currentPlan,
        targetPlan: newPlan,
        currentUsage,
        targetLimits: SUBSCRIPTION_TIERS[newPlan as SubscriptionLevel].limits,
        violations,
        hasViolations: violations.length > 0,
        potentialRefund: potentialRefund > 0 ? potentialRefund : null,
        strategy:
          violations.length > 0
            ? "downgrade-with-restrictions"
            : "downgrade-immediately",
      },
    };

    if (violations.length > 0) {
      // User is over limits - they can still downgrade but will be restricted
      response.downgradeAnalysis.message =
        `You can downgrade to ${newPlan}, but you're currently over the limits. ` +
        `You'll keep your existing data but won't be able to add new items until you're within limits.`;

      response.downgradeAnalysis.restrictionMessage = `After downgrading, you'll be restricted from adding new Emergency Contacts or Authosized Representatives until you're within the ${newPlan} plan limits.`;

      response.nextStep = "confirm-with-restrictions";
    } else {
      // User is within limits - can downgrade freely
      response.downgradeAnalysis.message = `You can safely downgrade to ${newPlan} without any restrictions.`;

      response.nextStep = "proceed-with-downgrade";
    }

    // If they want to proceed (this will be a second API call), handle the actual downgrade
    const { confirmDowngrade } = await request
      .json()
      .catch(() => ({ confirmDowngrade: false }));

    if (confirmDowngrade) {
      try {
        const accessToken = await getPayPalAccessToken();

        // Cancel current PayPal subscription if it exists
        if (currentSubscription.paypal_subscription_id) {
          await cancelPayPalSubscription(
            accessToken,
            currentSubscription.paypal_subscription_id,
            `User downgraded from ${currentPlan} to ${newPlan}`
          );
        }

        // Mark current subscription as inactive
        await supabaseAdmin
          .from("user_subscription")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentSubscription.id);

        response.downgradeCompleted = true;
        response.nextStep =
          newPlan === "bronze"
            ? "downgrade-complete"
            : "create-new-subscription";
        response.message =
          newPlan === "bronze"
            ? "Downgraded to Bronze (Free) plan successfully."
            : `Current subscription cancelled. Please complete payment for ${newPlan} plan.`;

        // If downgrading to Bronze, create the Bronze subscription immediately
        if (newPlan === "bronze") {
          const { error: createError } = await supabaseAdmin
            .from("user_subscription")
            .insert({
              user_id: userId,
              subscription_level: "bronze",
              subscription_start_date: new Date().toISOString(),
              subscription_end_date: null, // Bronze doesn't expire
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (createError) {
            console.error("Failed to create Bronze subscription:", createError);
            throw new Error("Failed to complete downgrade to Bronze plan");
          }
        }
      } catch (error) {
        console.error("❌ Downgrade execution failed:", error);
        return NextResponse.json(
          {
            error: "Failed to complete downgrade process",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Subscription downgrade analysis failed:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze subscription downgrade",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
