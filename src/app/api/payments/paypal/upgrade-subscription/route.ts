/**
 * PayPal Subscription Upgrade API Route
 * Handles subscription upgrades with proper PayPal subscription management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/utils/supabase/admin';

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL!;

// Create Supabase admin client
const supabaseAdmin = createAdminClient();

// Plan configurations
const PLAN_CONFIGS = {
  silver: { type: 'recurring', yearsCovered: 1, isRecurring: true, totalCycles: 0 },
  gold: { type: 'recurring', yearsCovered: 5, isRecurring: true, totalCycles: 5 },
  platinum: { type: 'recurring', yearsCovered: 10, isRecurring: true, totalCycles: 10 }
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

// Cancel PayPal subscription
async function cancelPayPalSubscription(accessToken: string, subscriptionId: string, reason: string) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      reason: reason
    }),
  });

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text();
    throw new Error(`PayPal subscription cancellation failed: ${errorText}`);
  }

  return { success: true };
}

// Get user's current subscription
async function getCurrentSubscription(userId: string) {
  const { data: subscription, error } = await supabaseAdmin
    .from('user_subscription')
    .select('*')
    .eq('user_id', userId) 
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // Not found is OK
    throw new Error(`Failed to get current subscription: ${error.message}`);
  }

  return subscription;
}

// Calculate proration credit for unused time
function calculateProrationCredit(subscription: any): number {
  if (!subscription || !subscription.subscription_end_date) return 0;

  const now = new Date();
  const endDate = new Date(subscription.subscription_end_date);
  const startDate = new Date(subscription.subscription_start_date);
  
  if (endDate <= now) return 0; // Already expired
  
  const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const unusedDays = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const usagePercentage = unusedDays / totalDays;
  
  // Calculate refund based on current plan pricing
  let annualPrice = 29; // Default Silver
  if (subscription.subscription_level === 'gold') annualPrice = 99.99;
  else if (subscription.subscription_level === 'platinum') annualPrice = 199.99;
  
  if (usagePercentage > 0.1) { // Only refund if >10% unused
    return Math.round(annualPrice * usagePercentage * 100) / 100; // Round to 2 decimals
  }
  
  return 0;
}

// Issue PayPal refund for prorated amount
async function issuePayPalRefund(accessToken: string, transactionId: string, amount: number) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v2/payments/captures/${transactionId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      amount: {
        value: amount.toFixed(2),
        currency_code: 'USD'
      },
      note_to_payer: 'Prorated refund for subscription upgrade'
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal refund failed: ${errorText}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const { userId, currentPlan, newPlan } = await request.json();

    if (!userId || !currentPlan || !newPlan) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, currentPlan, newPlan' },
        { status: 400 }
      );
    }

    // Get current subscription
    const currentSubscription = await getCurrentSubscription(userId);
    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'No active subscription found to upgrade' },
        { status: 404 }
      );
    }

    const accessToken = await getPayPalAccessToken();
    let upgradeStrategy = '';
    let prorationCredit = 0;

    // Determine upgrade strategy
    const currentConfig = PLAN_CONFIGS[currentPlan as keyof typeof PLAN_CONFIGS];
    const newConfig = PLAN_CONFIGS[newPlan as keyof typeof PLAN_CONFIGS];

    if (!currentConfig || !newConfig) {
      return NextResponse.json(
        { error: 'Invalid plan level specified' },
        { status: 400 }
      );
    }

    // Calculate proration credit if applicable
    prorationCredit = calculateProrationCredit(currentSubscription);

    // Since all plans are now recurring subscriptions, we use a simpler strategy
    if (currentPlan === newPlan) {
      // Same plan: Continue existing subscription
      upgradeStrategy = 'continue';
      
      return NextResponse.json({
        success: true,
        strategy: upgradeStrategy,
        message: `${currentPlan} plan continues unchanged`,
        prorationCredit: 0
      });

    } else {
      // Different plan: Cancel current and create new subscription
      upgradeStrategy = 'cancel-and-create';
      
      // Cancel current PayPal subscription if it exists
      if (currentSubscription.paypal_subscription_id) {
        await cancelPayPalSubscription(
          accessToken, 
          currentSubscription.paypal_subscription_id,
          `User upgraded from ${currentPlan} to ${newPlan}`
        );
      }

      // Create new subscription request (client will handle PayPal flow)
      return NextResponse.json({
        success: true,
        strategy: upgradeStrategy,
        message: `${currentPlan} subscription cancelled. Create new ${newPlan} subscription.`,
        prorationCredit,
        nextStep: 'create-new-subscription',
        newPlan
      });
    }

  } catch (error) {
    console.error('❌ Subscription upgrade failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process subscription upgrade', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
