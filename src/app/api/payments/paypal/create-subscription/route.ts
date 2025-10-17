import { NextRequest, NextResponse } from "next/server";
import { PAYPAL_PLAN_CONFIG } from "@/services/paypalSubscriptionService";
import { APP_TITLE } from "@/app/constants/app.config";

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

// Constants for URL paths based on source type
const URL_PATHS = {
  REGISTRATION: {
    SUCCESS: "/register?payment=success&step=confirmation",
    CANCEL: "/register",
  },
  SUBSCRIPTION: {
    SUCCESS: "/dashboard/subscription/success",
    CANCEL: "/dashboard/subscription/cancel",
  },
};

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

// Create subscription with PayPal
async function createPayPalSubscription(
  accessToken: string,
  planId: string,
  userId: string,
  returnUrl: string,
  cancelUrl: string
) {
  console.log("📣 Creating PayPal subscription with URLs:");
  console.log(`Return URL: ${returnUrl}`);
  console.log(`Cancel URL: ${cancelUrl}`);

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `SUB-${Date.now()}-${userId}`, // Ensure unique request ID
    },
    body: JSON.stringify({
      plan_id: planId,
      application_context: {
        brand_name: APP_TITLE,
        locale: "en-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
        },
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
      subscriber: {
        name: {
          given_name: "User",
          surname: userId.substring(0, 5),
        },
      },
      custom_id: userId,
    }),
  });

  if (!response.ok) {
    let errorText = "Unknown error";
    try {
      const errorData = await response.json();
      errorText = JSON.stringify(errorData);
    } catch {
      errorText = await response.text();
    }
    throw new Error(`PayPal API error: ${errorText}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      planLevel,
      userId,
      source = "subscription",
      returnUrl: customReturnUrl,
      cancelUrl: customCancelUrl,
    } = body;

    // Log all received parameters
    console.log("===== PAYPAL SUBSCRIPTION CREATE/UPDATE =====");
    console.log(`Plan Level: ${planLevel}`);
    console.log(`User ID: ${userId}`);
    console.log(`Source: ${source}`); // Should be "registration" or "subscription"
    console.log(`Custom Return URL: ${customReturnUrl || "Not provided"}`);
    console.log(`Custom Cancel URL: ${customCancelUrl || "Not provided"}`);

    // Input validation
    if (!planLevel || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: planLevel and userId",
        },
        { status: 400 }
      );
    }

    // Get plan configuration
    const planConfig = PAYPAL_PLAN_CONFIG[planLevel.toLowerCase()];
    if (!planConfig) {
      return NextResponse.json(
        { success: false, error: `Invalid plan level: ${planLevel}` },
        { status: 400 }
      );
    }

    // IMPORTANT: Use custom URLs if provided, otherwise determine from source
    const sourcePaths =
      source === "registration"
        ? URL_PATHS.REGISTRATION
        : URL_PATHS.SUBSCRIPTION;

    const returnUrl = customReturnUrl || `${APP_URL}${sourcePaths.SUCCESS}`;
    const cancelUrl = customCancelUrl || `${APP_URL}${sourcePaths.CANCEL}`;

    // Log the URLs for debugging
    console.log(`Final Return URL: ${returnUrl}`);
    console.log(`Final Cancel URL: ${cancelUrl}`);

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create subscription with PayPal
    const subscription = await createPayPalSubscription(
      accessToken,
      planConfig.paypalPlanId,
      userId,
      returnUrl, // Use the determined return URL
      cancelUrl // Use the determined cancel URL
    );

    // Get the approval URL
    const approvalUrl = subscription.links.find(
      (link: any) => link.rel === "approve"
    )?.href;

    if (!approvalUrl) {
      throw new Error("PayPal approval URL is missing from response");
    }

    // Construct response
    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      approvalUrl: approvalUrl,
      planLevel: planLevel,
      status: subscription.status,
      source: source, // Return the source back to the client
      returnUrl, // Include the actual URLs used in the response
      cancelUrl,
      billingInfo: {
        interval: planConfig.billingInterval,
        intervalCount: planConfig.intervalCount,
        yearsCovered: planConfig.yearsCovered || 1,
        isRecurring: planConfig.isRecurring,
      },
    });
  } catch (error: any) {
    console.error("PayPal subscription creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create PayPal subscription",
        suggestion:
          "Please try again or contact support if the problem persists",
      },
      { status: 500 }
    );
  }
}
