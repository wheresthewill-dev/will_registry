/**
 * PayPal Capture Order API Route
 * This route captures PayPal one-time payments for Gold & Platinum plans.
 * 
 * Usage:
 * - Gold: One-time payment of $99.99 for 5-year access
 * - Platinum: One-time payment of $199.99 for 10-year access
 * - Silver continues to use the activate-subscription API for recurring billing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/utils/supabase/admin';
import { getUserByAuthId } from '@/app/utils/userUtils';
import { PAYPAL_PLAN_CONFIG } from '@/services/paypalSubscriptionService';

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL!;

// Create Supabase admin client
const supabaseAdmin = createAdminClient();

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

// Capture PayPal order
async function capturePayPalOrder(accessToken: string, orderId: string) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal capture error: ${errorText}`);
  }

  return response.json();
}

// Update user subscription in database
async function updateUserSubscription(authUserId: string, planLevel: string, transactionId: string, amount: string = '0', orderId?: string, paypalResponse?: any) {
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

  // Calculate subscription end date based on plan configuration
  const now = new Date();
  let subscriptionEndDate: Date | null = null;
  const planLower = planLevel.toLowerCase();

  // Get plan configuration from PayPal config
  const planConfig = PAYPAL_PLAN_CONFIG[planLower];

  if (planConfig && planConfig.yearsCovered) {
    // Multi-year plans (Gold & Platinum)
    subscriptionEndDate = new Date(now.getFullYear() + planConfig.yearsCovered, now.getMonth(), now.getDate());
  } else {
    // Fallback for plans not in config or Bronze
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
      default:
        throw new Error(`Invalid subscription plan: "${planLevel}" (normalized: "${planLower}")`);
    }
  }

  console.log(`Updating subscription for user ${dbUserId} (auth: ${authUserId}) to ${planLower} until ${subscriptionEndDate?.toISOString() || 'no end date'}`);

  // Use the existing database function to update subscription
  const { data, error: subscriptionError } = await supabaseAdmin
    .rpc('update_subscription_level', {
      p_user_id: dbUserId, // Use the database user ID (integer)
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
        transaction_id: transactionId,
        payment_method: 'paypal',
        amount: parseFloat(amount), 
        currency: 'USD',
        subscription_level: planLower,
        payment_status: 'completed',
        gateway_order_id: orderId || null,
        gateway_response: paypalResponse || null,
        processed_at: new Date().toISOString(),
      });

    if (paymentError) {
      console.warn('Failed to record payment transaction:', paymentError);
      // Don't fail the whole process if payment logging fails
    } else {
      console.log(`💳 Payment transaction recorded: ${transactionId}`);
    }
  } catch (error) {
    console.warn('Failed to insert payment transaction:', error);
    // Continue without failing if payment recording fails
  }

  return subscriptionEndDate || new Date(); // Return current date for bronze tier
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    const body = await request.json();
    const { orderId, userId } = body;

    console.log(`🔄 [${requestId}] Capturing PayPal order... (${startTime})`);
    console.log(`🆔 [${requestId}] Order ID:`, orderId);
    console.log(`👤 [${requestId}] User ID:`, userId);

    // Validate required fields
    if (!orderId || !userId) {
      console.log(`❌ [${requestId}] Missing required fields`);
      return NextResponse.json(
        { error: 'Missing required fields: orderId and userId' },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // First, check the current order status
    console.log(`🔍 [${requestId}] Checking order status...`);
    const orderDetailsResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!orderDetailsResponse.ok) {
      const errorText = await orderDetailsResponse.text();
      throw new Error(`Failed to get order details: ${errorText}`);
    }

    const orderDetails = await orderDetailsResponse.json();
    console.log(`📋 [${requestId}] Order status:`, orderDetails.status);

    // Check if order is already captured
    if (orderDetails.status === 'COMPLETED') {
      console.log(`⚠️ [${requestId}] Order already captured, retrieving existing transaction...`);
      
      // Extract transaction details from the completed order
      const capture = orderDetails.purchase_units[0]?.payments?.captures?.[0];
      if (capture) {
        // Parse the custom_id which now contains JSON with plan information
        let planLevel;
        try {
          const customData = JSON.parse(capture.custom_id);
          planLevel = customData.planLevel;
        } catch (e) {
          // Fallback to treating custom_id as plain text (legacy format)
          planLevel = capture.custom_id;
        }
        
        if (!planLevel) {
          console.error(`❌ [${requestId}] No plan information found in completed order`);
          console.error('Capture details:', JSON.stringify(capture, null, 2));
          return NextResponse.json(
            { error: 'Order missing subscription plan information' },
            { status: 400 }
          );
        }
        
        // Update user subscription in database (idempotent operation)
        const subscriptionEndDate = await updateUserSubscription(userId, planLevel, capture.id, capture.amount.value);
        
        console.log(`✅ [${requestId}] Returning already captured order data`);
        return NextResponse.json({
          success: true,
          transactionId: capture.id,
          plan: planLevel,
          amount: capture.amount.value,
          subscriptionEndDate: subscriptionEndDate.toISOString(),
          status: 'ALREADY_CAPTURED',
          message: 'Order was already captured successfully'
        });
      }
    }

    // Check if order is in a valid state for capture
    if (orderDetails.status !== 'APPROVED') {
      console.log(`❌ [${requestId}] Order not approved. Status: ${orderDetails.status}`);
      return NextResponse.json(
        { 
          error: `Order is not in approved state for capture. Current status: ${orderDetails.status}`,
          status: orderDetails.status,
          orderId,
          suggestion: 'Please complete the PayPal approval process or create a new order'
        },
        { status: 400 }
      );
    }

    // Proceed with capture only if status is APPROVED
    console.log(`✅ [${requestId}] Order approved, proceeding with capture...`);
    const captureResult = await capturePayPalOrder(accessToken, orderId);

    // Check if capture was successful
    if (captureResult.status !== 'COMPLETED') {
      console.log(`❌ [${requestId}] PayPal payment not completed. Status: ${captureResult.status}`);
      return NextResponse.json(
        { error: 'PayPal payment was not completed' },
        { status: 400 }
      );
    }

    // Extract payment details
    const purchase_unit = captureResult.purchase_units[0];
    const capture = purchase_unit.payments.captures[0];
    
    // Parse the custom_id which now contains JSON with plan information
    let planLevel;
    try {
      const customData = JSON.parse(capture.custom_id);
      planLevel = customData.planLevel;
    } catch (e) {
      // Fallback to treating custom_id as plain text (legacy format)
      planLevel = capture.custom_id;
    }
    
    const transactionId = capture.id;
    const amount = capture.amount.value;

    console.log(`💰 [${requestId}] Payment captured successfully`);
    console.log(`🎯 [${requestId}] Plan:`, planLevel);
    console.log(`💵 [${requestId}] Amount:`, amount);
    console.log(`🔑 [${requestId}] Transaction ID:`, transactionId);

    // Validate plan is present
    if (!planLevel) {
      console.error(`❌ [${requestId}] No plan information found in PayPal capture response`);
      console.error('Capture details:', JSON.stringify(capture, null, 2));
      return NextResponse.json(
        { error: 'PayPal order missing subscription plan information' },
        { status: 400 }
      );
    }

    // Update user subscription in database
    const subscriptionEndDate = await updateUserSubscription(userId, planLevel, transactionId, amount);

    console.log(`✅ [${requestId}] Subscription updated successfully`);
    console.log(`📅 [${requestId}] Subscription ends:`, subscriptionEndDate);
    console.log(`⏱️ [${requestId}] Total processing time: ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      transactionId: transactionId,
      plan: planLevel,
      amount: amount,
      subscriptionEndDate: subscriptionEndDate.toISOString(),
      message: 'Payment captured and subscription updated successfully'
    });

  } catch (error) {
    console.error(`❌ [${requestId}] PayPal capture failed:`, error);
    
    // Handle specific PayPal errors
    if (error instanceof Error && error.message.includes('MAX_NUMBER_OF_PAYMENT_ATTEMPTS_EXCEEDED')) {
      return NextResponse.json(
        { 
          error: 'Payment attempt limit exceeded. Please create a new order.',
          code: 'MAX_ATTEMPTS_EXCEEDED',
          suggestion: 'Try creating a new payment order from the subscription page'
        },
        { status: 422 }
      );
    }

    if (error instanceof Error && error.message.includes('UNPROCESSABLE_ENTITY')) {
      console.log(`⚠️ [${requestId}] UNPROCESSABLE_ENTITY - likely duplicate capture attempt`);
      return NextResponse.json(
        { 
          error: 'Order cannot be processed. It may have expired or been used already.',
          code: 'ORDER_NOT_PROCESSABLE',
          suggestion: 'Please create a new payment order'
        },
        { status: 422 }
      );
    }

    console.log(`⏱️ [${requestId}] Failed processing time: ${Date.now() - startTime}ms`);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to capture PayPal payment',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}
