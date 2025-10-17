/**
 * PayPal Create Order API Route
 * This route creates PayPal orders for one-time payments (Gold & Platinum plans).
 * 
 * Usage:
 * - Gold: One-time payment of $99.99 for 5-year access
 * - Platinum: One-time payment of $199.99 for 10-year access
 * - Silver continues to use the subscription API for recurring billing
 */

import { NextRequest, NextResponse } from 'next/server';
import { PAYPAL_PLAN_CONFIG } from '@/services/paypalSubscriptionService';

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

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  throw new Error('Missing PayPal environment variables');
}

// Get PayPal access token
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

// Create PayPal order
async function createPayPalOrder(accessToken: string, orderData: any) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorText = await response.text();
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

    console.log('===== PAYPAL ORDER CREATE =====');
    console.log(`Plan Level: ${planLevel}`);
    console.log(`User ID: ${userId}`);
    console.log(`Source: ${source}`);
    console.log(`Custom Return URL: ${customReturnUrl || "Not provided"}`);
    console.log(`Custom Cancel URL: ${customCancelUrl || "Not provided"}`);

    // Input validation
    if (!planLevel || !userId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: planLevel and userId' 
        },
        { status: 400 }
      );
    }

    // Get plan configuration
    const planConfig = PAYPAL_PLAN_CONFIG[planLevel.toLowerCase()];
    if (!planConfig) {
      return NextResponse.json(
        { 
          success: false,
          error: `Invalid plan level: ${planLevel}` 
        },
        { status: 400 }
      );
    }

    // Only allow one-time payment plans (Gold & Platinum)
    if (planConfig.billingInterval !== "ONE_TIME") {
      return NextResponse.json(
        { 
          success: false,
          error: `Plan ${planLevel} should use subscription API, not order API` 
        },
        { status: 400 }
      );
    }

    // Determine URLs based on source
    const sourcePaths = source === "registration" ? URL_PATHS.REGISTRATION : URL_PATHS.SUBSCRIPTION;
    const returnUrl = customReturnUrl || `${APP_URL}${sourcePaths.SUCCESS}`;
    const cancelUrl = customCancelUrl || `${APP_URL}${sourcePaths.CANCEL}`;

    console.log(`Final Return URL: ${returnUrl}`);
    console.log(`Final Cancel URL: ${cancelUrl}`);

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create order data
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `${planLevel.toUpperCase()}_${userId}_${Date.now()}`,
          description: `${planConfig.name} - ${planConfig.yearsCovered}-year access`,
          amount: {
            currency_code: 'USD',
            value: planConfig.price.toFixed(2),
          },
          custom_id: JSON.stringify({
            planLevel,
            userId,
            yearsCovered: planConfig.yearsCovered,
            source,
          }),
        },
      ],
      application_context: {
        brand_name: 'Where\'s The Will',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    };

    // Create the order
    const order = await createPayPalOrder(accessToken, orderData);

    // Get approval URL
    const approvalUrl = order.links.find((link: any) => link.rel === 'approve')?.href;

    if (!approvalUrl) {
      throw new Error('PayPal approval URL is missing from response');
    }

    console.log('✅ PayPal order created successfully');
    console.log('🔗 Order ID:', order.id);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      approvalUrl: approvalUrl,
      planLevel: planLevel,
      status: order.status,
      source: source,
      returnUrl,
      cancelUrl,
      message: `One-time payment order created for ${planConfig.name}`,
    });

  } catch (error: any) {
    console.error('❌ PayPal order creation failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create PayPal order',
        suggestion: 'Please try again or contact support if the problem persists'
      },
      { status: 500 }
    );
  }
}
