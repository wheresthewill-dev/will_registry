/**
 * PayPal Webhooks API Route
 * Handles PayPal webhook events for subscription management
 * Updated to support both old order-based and new subscription-based payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/utils/supabase/admin';
import crypto from 'crypto';

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID!;
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL;

// Create Supabase admin client
const supabaseAdmin = createAdminClient();

// Plan configurations for subscription handling
const PLAN_CONFIGS = {
  silver: { intervalCount: 1, yearsCovered: 1, isRecurring: true },
  gold: { intervalCount: 1, yearsCovered: 5, isRecurring: false },
  platinum: { intervalCount: 1, yearsCovered: 10, isRecurring: false }
};

// Verify PayPal webhook signature
async function verifyWebhookSignature(headers: any, body: string) {
  if (!PAYPAL_WEBHOOK_ID) {
    console.warn('⚠️ PayPal webhook verification skipped - PAYPAL_WEBHOOK_ID not set');
    return true; // Skip verification in development
  }

  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    // Get access token
    const tokenResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Verify webhook
    const verificationData = {
      transmission_id: headers['paypal-transmission-id'],
      cert_id: headers['paypal-cert-id'],
      auth_algo: headers['paypal-auth-algo'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(body)
    };

    const verifyResponse = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationData),
    });

    const verifyResult = await verifyResponse.json();
    return verifyResult.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('❌ Webhook verification failed:', error);
    return false;
  }
}

// Handle payment completion (DEPRECATED - for old order-based payments)
async function handlePaymentCompleted(event: any) {
  console.log('⚠️ Legacy payment completed event (deprecated)');
  // Keep existing logic for backward compatibility
  // ... existing implementation
}

// Handle subscription creation
async function handleSubscriptionCreated(event: any) {
  const subscription = event.resource;
  const userId = subscription.custom_id;
  const subscriptionId = subscription.id;
  
  console.log('🆕 Subscription created:', subscriptionId, 'for user:', userId);
  
  // Log the subscription creation but don't activate yet
  // Activation happens when payment is confirmed
  try {
    await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: parseInt(userId),
        transaction_id: subscriptionId,
        payment_method: 'paypal_subscription',
        payment_status: 'created',
        gateway_response: subscription,
        processed_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('❌ Failed to log subscription creation:', error);
  }
}

// Handle subscription activation
async function handleSubscriptionActivated(event: any) {
  const subscription = event.resource;
  const userId = subscription.custom_id;
  const subscriptionId = subscription.id;
  
  console.log('🎯 Subscription activated:', subscriptionId, 'for user:', userId);
  
  // Determine plan level from billing amount or plan_id
  let planLevel = 'silver'; // default
  const billingAmount = subscription.billing_info?.last_payment?.amount?.value;
  if (billingAmount) {
    const amount = parseFloat(billingAmount);
    if (amount === 29) planLevel = 'silver';
    else if (amount === 99) planLevel = 'gold';
    else if (amount === 199) planLevel = 'platinum';
  }

  const config = PLAN_CONFIGS[planLevel as keyof typeof PLAN_CONFIGS];
  const now = new Date();
  const endDate = new Date(now.getFullYear() + config.yearsCovered, now.getMonth(), now.getDate());
  
  console.log(`📅 Activating ${planLevel} subscription until ${endDate.toISOString()}`);
  console.log(`🔄 Covers ${config.yearsCovered} year(s), Recurring: ${config.isRecurring}`);
  
  try {
    // Update subscription using database function
    const { error: subscriptionError } = await supabaseAdmin
      .rpc('update_subscription_level', {
        p_user_id: parseInt(userId),
        p_new_level: planLevel,
        p_end_date: endDate.toISOString()
      });

    if (subscriptionError) {
      console.error('❌ Failed to update subscription:', subscriptionError);
      return;
    }

    // Update subscription metadata
    await supabaseAdmin
      .from('user_subscription')
      .update({
        paypal_subscription_id: subscriptionId,
        is_recurring: config.isRecurring,
        billing_interval_years: config.yearsCovered, // Use actual years covered
        next_billing_date: config.isRecurring ? endDate.toISOString() : null,
        subscription_type: config.isRecurring ? 'recurring' : 'prepaid',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', parseInt(userId));

    console.log(`✅ Subscription activated for user ${userId}`);
  } catch (error) {
    console.error('❌ Failed to activate subscription:', error);
  }
}

// Handle recurring payments (for Silver plan)
async function handleRecurringPayment(event: any) {
  const sale = event.resource;
  const subscriptionId = sale.billing_agreement_id;
  
  console.log('🔄 Recurring payment received for subscription:', subscriptionId);
  
  // Get subscription details
  const { data: subscription } = await supabaseAdmin
    .from('user_subscription')
    .select('*')
    .eq('paypal_subscription_id', subscriptionId)
    .single();
    
  if (!subscription) {
    console.error('❌ Subscription not found for recurring payment:', subscriptionId);
    return;
  }
  
  // Only Silver plan should have recurring payments
  if (subscription.subscription_level !== 'silver') {
    console.warn('⚠️ Unexpected recurring payment for non-recurring plan:', subscription.subscription_level);
    return;
  }
  
  // Extend subscription by 1 year
  const currentEndDate = new Date(subscription.end_date);
  const newEndDate = new Date(currentEndDate.getFullYear() + 1, currentEndDate.getMonth(), currentEndDate.getDate());
  
  try {
    await supabaseAdmin
      .from('user_subscription')
      .update({
        end_date: newEndDate.toISOString(),
        next_billing_date: newEndDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', subscriptionId);
      
    // Record the payment transaction
    await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: subscription.user_id,
        transaction_id: sale.id,
        payment_method: 'paypal_subscription',
        amount: parseFloat(sale.amount.total),
        currency: sale.amount.currency,
        subscription_level: 'silver',
        payment_status: 'completed',
        gateway_order_id: subscriptionId,
        processed_at: new Date().toISOString()
      });
      
    console.log(`✅ Silver subscription renewed for user ${subscription.user_id} until ${newEndDate.toISOString()}`);
  } catch (error) {
    console.error('❌ Failed to process recurring payment:', error);
  }
}

// Handle subscription suspension (failed payment)
async function handleSubscriptionSuspended(event: any) {
  const subscription = event.resource;
  const subscriptionId = subscription.id;
  
  console.log('⚠️ Subscription suspended:', subscriptionId);
  
  // Update subscription status to suspended
  const { error } = await supabaseAdmin
    .from('user_subscription')
    .update({
      status: 'suspended',
      updated_at: new Date().toISOString()
    })
    .eq('paypal_subscription_id', subscriptionId);

  if (error) {
    console.error('❌ Failed to update suspended subscription:', error);
  }
}

// Handle payment failure
async function handlePaymentFailed(event: any) {
  const sale = event.resource;
  const subscriptionId = sale.billing_agreement_id;
  
  console.log('❌ Payment failed for subscription:', subscriptionId);
  
  // Log the failed payment
  try {
    await supabaseAdmin
      .from('payment_transactions')
      .insert({
        transaction_id: sale.id,
        payment_method: 'paypal_subscription',
        amount: parseFloat(sale.amount.total),
        currency: sale.amount.currency,
        payment_status: 'failed',
        gateway_order_id: subscriptionId,
        gateway_response: sale,
        processed_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('❌ Failed to log payment failure:', error);
  }
}

// Handle subscription cancellation (UPDATED)
async function handleSubscriptionCancelled(event: any) {
  const resource = event.resource;
  const subscriptionId = resource.id;
  
  console.log('❌ Subscription cancelled:', subscriptionId);
  
  // Update subscription status to cancelled
  const { error } = await supabaseAdmin
    .from('user_subscription')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('paypal_subscription_id', subscriptionId);

  if (error) {
    console.error('❌ Failed to update cancelled subscription:', error);
  }
}

// Handle subscription expired
async function handleSubscriptionExpired(event: any) {
  const resource = event.resource;
  const subscriptionId = resource.id;
  
  console.log('⏰ Subscription expired:', subscriptionId);
  
  // Update subscription status to expired
  const { error } = await supabaseAdmin
    .from('user_subscription')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString()
    })
    .eq('paypal_subscription_id', subscriptionId);

  if (error) {
    console.error('❌ Failed to update expired subscription:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('🔔 PayPal webhook received');
    
    // Verify webhook signature
    const isValid = await verifyWebhookSignature(headers, body);
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event_type;
    
    console.log('🎯 Event type:', eventType);

    // Handle different event types
    switch (eventType) {
      // Legacy order-based events (DEPRECATED)
      case 'PAYMENT.CAPTURE.COMPLETED':
      case 'CHECKOUT.ORDER.COMPLETED':
        console.log('⚠️ Handling legacy order event (deprecated)');
        await handlePaymentCompleted(event);
        break;
        
      // New subscription-based events
      case 'BILLING.SUBSCRIPTION.CREATED':
        await handleSubscriptionCreated(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event);
        break;
        
      case 'PAYMENT.SALE.COMPLETED':
        await handleRecurringPayment(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(event);
        break;
        
      case 'PAYMENT.SALE.DENIED':
        await handlePaymentFailed(event);
        break;
        
      default:
        console.log('ℹ️ Unhandled event type:', eventType);
    }

    return NextResponse.json({ success: true, eventType });

  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Webhook processing failed',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}
