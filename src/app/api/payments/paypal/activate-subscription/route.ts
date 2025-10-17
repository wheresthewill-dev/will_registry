/**
 * PayPal Activate Subscription API Route
 * Activates a PayPal subscription and updates user subscription in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByAuthId } from '@/app/utils/userUtils';
import { createAdminClient } from '@/app/utils/supabase/admin';

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL!;

// Create Supabase admin client
const supabaseAdmin = createAdminClient();

// Plan configurations
const PLAN_CONFIGS = {
  silver: {
    name: "Silver Plan",
    description: "Annual Silver subscription plan with complete alert system",
    price: 29.00, // Annual price for recurring subscription
    billingInterval: "YEAR",
    intervalCount: 1,
    yearsCovered: 1,
    isRecurring: true
  },
  gold: {
    name: "Gold Plan",
    description: "5-year Gold access plan with premium features - One-time payment",
    price: 99.99, // One-time payment for 5-year access
    billingInterval: "ONE_TIME",
    intervalCount: 1,
    yearsCovered: 5,
    isRecurring: false
  },
  platinum: {
    name: "Platinum Plan",
    description: "10-year Platinum access plan with premium protection - One-time payment",
    price: 199.99, // One-time payment for 10-year access
    billingInterval: "ONE_TIME", 
    intervalCount: 1,
    yearsCovered: 10,
    isRecurring: false
  }
};

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

// Get PayPal subscription details
async function getPayPalSubscription(accessToken: string, subscriptionId: string) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal subscription API error: ${errorText}`);
  }

  return response.json();
}

// Update user subscription in database
async function updateUserSubscription(
  authUserId: string, 
  planLevel: string, 
  subscriptionId: string,
  subscriptionData: any
) {
  // Validate inputs
  if (!planLevel) {
    throw new Error('Plan level is required but was not provided');
  }
  
  if (!authUserId) {
    throw new Error('User ID is required but was not provided');
  }

  console.log(`Raw plan value: "${planLevel}", type: ${typeof planLevel}`);
  console.log(`Auth User ID: ${authUserId}`);

  // Get the database user using the utility function
  const user = await getUserByAuthId(authUserId);
  const dbUserId = user.id;
  
  console.log(`Database User ID: ${dbUserId} (type: ${typeof dbUserId})`);

  // Calculate subscription end date based on plan
  const now = new Date();
  let subscriptionEndDate: Date | null = null;
  const planLower = planLevel.toLowerCase();
  const config = PLAN_CONFIGS[planLower as keyof typeof PLAN_CONFIGS];

  if (!config) {
    throw new Error(`Invalid subscription plan: "${planLevel}" (normalized: "${planLower}")`);
  }

  switch (planLower) {
    case 'bronze':
      // Bronze is free tier with no end date
      subscriptionEndDate = null;
      break;
    case 'silver':
      subscriptionEndDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      break;
    case 'gold':
      subscriptionEndDate = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());
      break;
    case 'platinum':
      subscriptionEndDate = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
      break;
  }

  console.log(`Updating subscription for user ${dbUserId} (auth: ${authUserId}) to ${planLower} until ${subscriptionEndDate?.toISOString() || 'no end date'}`);

  // Use the existing database function to update subscription
  const { data, error: subscriptionError } = await supabaseAdmin
    .rpc('update_subscription_level', {
      p_user_id: dbUserId,
      p_new_level: planLower,
      p_end_date: subscriptionEndDate?.toISOString() || null
    });

  if (subscriptionError) {
    console.error('Subscription update error:', subscriptionError);
    throw new Error(`Failed to update subscription: ${subscriptionError.message}`);
  }

  console.log(`✅ Subscription updated successfully for user ${dbUserId} (auth: ${authUserId})`);

  // Record payment transaction in payment_transactions table
  try {
    const { error: paymentError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: dbUserId,
        transaction_id: subscriptionId,
        payment_method: 'paypal_subscription',
        amount: config.price,
        currency: 'USD',
        subscription_level: planLower,
        payment_status: 'completed',
        gateway_order_id: subscriptionId,
        gateway_response: subscriptionData,
        processed_at: new Date().toISOString(),
      });

    if (paymentError) {
      console.warn('Failed to record payment transaction:', paymentError);
      // Don't fail the whole process if payment logging fails
    } else {
      console.log(`💳 Payment transaction recorded: ${subscriptionId}`);
    }
  } catch (error) {
    console.warn('Failed to insert payment transaction:', error);
    // Continue without failing if payment recording fails
  }

  // Update user_subscription table with PayPal-specific fields
  try {
    const { error: updateError } = await supabaseAdmin
      .from('user_subscription')
      .update({
        paypal_subscription_id: subscriptionId,
        is_recurring: config.isRecurring,
        billing_interval_years: config.yearsCovered, // Use yearsCovered for actual duration
        next_billing_date: config.isRecurring ? subscriptionEndDate?.toISOString() : null,
        subscription_type: config.isRecurring ? 'recurring' : 'prepaid',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', dbUserId);

    if (updateError) {
      console.warn('Failed to update subscription metadata:', updateError);
    } else {
      console.log(`📋 Subscription metadata updated for user ${dbUserId}`);
    }
  } catch (error) {
    console.warn('Failed to update subscription metadata:', error);
  }

  return subscriptionEndDate || new Date();
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    const body = await request.json();
    const { subscriptionId, userId } = body;

    console.log(`🔄 [${requestId}] Activating PayPal subscription... (${startTime})`);
    console.log(`🆔 [${requestId}] Subscription ID:`, subscriptionId);
    console.log(`👤 [${requestId}] User ID:`, userId);

    // Validate required fields
    if (!subscriptionId || !userId) {
      console.log(`❌ [${requestId}] Missing required fields`);
      return NextResponse.json(
        { error: 'Missing required fields: subscriptionId and userId' },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Get subscription details from PayPal
    console.log(`🔍 [${requestId}] Getting subscription details...`);
    const subscription = await getPayPalSubscription(accessToken, subscriptionId);

    console.log(`📋 [${requestId}] Subscription status:`, subscription.status);

    if (subscription.status !== 'ACTIVE') {
      console.log(`❌ [${requestId}] Subscription not active:`, subscription.status);
      return NextResponse.json(
        { error: `PayPal subscription is not active. Status: ${subscription.status}` },
        { status: 400 }
      );
    }

    // Determine plan level from subscription (you may need to store this differently)
    const customId = subscription.custom_id;
    if (customId !== userId) {
      console.warn(`⚠️ [${requestId}] Custom ID mismatch: expected ${userId}, got ${customId}`);
    }

    // For now, determine plan from billing amount or plan_id
    let planLevel = 'silver'; // default
    const billingAmount = subscription.billing_info?.last_payment?.amount?.value;
    if (billingAmount) {
      const amount = parseFloat(billingAmount);
      if (amount === 29) planLevel = 'silver';
      else if (amount === 99.99 || Math.abs(amount - 99.99) < 0.01) planLevel = 'gold';
      else if (amount === 199.99 || Math.abs(amount - 199.99) < 0.01) planLevel = 'platinum';
    }

    // Also check by plan_id as backup
    if (planLevel === 'silver') {
      const planId = subscription.plan_id;
      if (planId === process.env.PAYPAL_GOLD_PLAN_ID) planLevel = 'gold';
      else if (planId === process.env.PAYPAL_PLATINUM_PLAN_ID) planLevel = 'platinum';
      else if (planId === process.env.PAYPAL_SILVER_PLAN_ID) planLevel = 'silver';
    }

    console.log(`🎯 [${requestId}] Detected plan level:`, planLevel);

    // Update user subscription in database
    const subscriptionEndDate = await updateUserSubscription(
      userId, 
      planLevel, 
      subscriptionId,
      subscription
    );

    console.log(`✅ [${requestId}] Subscription activated successfully`);
    console.log(`📅 [${requestId}] Subscription ends:`, subscriptionEndDate);
    console.log(`⏱️ [${requestId}] Total processing time: ${Date.now() - startTime}ms`);

    const config = PLAN_CONFIGS[planLevel as keyof typeof PLAN_CONFIGS];

    return NextResponse.json({
      success: true,
      subscriptionId: subscriptionId,
      planLevel: planLevel,
      status: subscription.status,
      nextBillingDate: config.isRecurring ? subscriptionEndDate.toISOString() : null,
      endDate: subscriptionEndDate.toISOString(),
      message: `${config.name} subscription activated successfully`
    });

  } catch (error) {
    console.error(`❌ [${requestId}] PayPal subscription activation failed:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to activate PayPal subscription', 
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please contact support if this issue persists'
      },
      { status: 500 }
    );
  }
}
