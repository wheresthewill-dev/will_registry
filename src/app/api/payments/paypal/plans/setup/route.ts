/**
 * PayPal Subscription Plans Setup API
 * Creates and manages PayPal subscription plans for different tiers
 */

import { NextRequest, NextResponse } from 'next/server';

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL!;

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

// Get existing PayPal product or create new one
async function getOrCreatePayPalProduct(accessToken: string, productData: any) {
  // First try to get existing product
  try {
    const getResponse = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products/${productData.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (getResponse.ok) {
      const existingProduct = await getResponse.json();
      console.log(`✅ Using existing product: ${existingProduct.id}`);
      return existingProduct;
    }
  } catch (error) {
    console.log(`Product ${productData.id} doesn't exist, creating new one...`);
  }

  // Create new product if doesn't exist
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal product creation error: ${errorText}`);
  }

  return response.json();
}

// Get existing PayPal plan or create new one
async function getOrCreatePayPalPlan(accessToken: string, planData: any, tier: string) {
  // Try to create the plan first - if it exists, PayPal will return an error
  try {
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(planData),
    });

    if (response.ok) {
      return response.json();
    }

    const errorText = await response.text();
    const errorData = JSON.parse(errorText);
    
    // If plan already exists with same name, try to find it by listing plans
    if (errorData.name === 'UNPROCESSABLE_ENTITY' || errorData.details?.some((d: any) => d.issue === 'DUPLICATE_RESOURCE_IDENTIFIER')) {
      console.log(`Plan for ${tier} may already exist, searching for existing plans...`);
      
      // List existing plans to find the one we need
      const listResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans?product_id=${planData.product_id}&page_size=20`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (listResponse.ok) {
        const listData = await listResponse.json();
        const existingPlan = listData.plans?.find((plan: any) => plan.name === planData.name);
        if (existingPlan) {
          console.log(`✅ Using existing plan: ${existingPlan.id}`);
          return existingPlan;
        }
      }
    }

    throw new Error(`PayPal plan creation error: ${errorText}`);

  } catch (error) {
    if (error instanceof Error && error.message.includes('PayPal plan creation error')) {
      throw error;
    }
    throw new Error(`PayPal plan creation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Plan configurations
const PLAN_CONFIGS = {
  silver: {
    name: "Silver Plan", 
    description: "Annual Silver subscription plan with complete alert system",
    price: "29.00",
    interval_unit: "YEAR",
    interval_count: 1,
    total_cycles: 0 // Recurring annually forever
  },
  // NOTE: Gold and Platinum are now one-time payments, not subscriptions
  // They use PayPal Orders API instead of Subscriptions API
  // This setup endpoint only handles Silver (recurring subscription)
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Setting up PayPal subscription plans...');

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    const results = [];

    // Create product and plans for each subscription tier
    for (const [tier, config] of Object.entries(PLAN_CONFIGS)) {
      try {
        console.log(`📋 Creating ${tier} plan...`);

        // Create product first
        const productData = {
          id: `WTW_${tier.toUpperCase()}_PRODUCT`,
          name: `The International Will Registry ${config.name}`,
          description: config.description,
          type: "SERVICE",
          category: "SOFTWARE"
        };

        const product = await getOrCreatePayPalProduct(accessToken, productData);
        console.log(`✅ Product created for ${tier}:`, product.id);

        // Create subscription plan
        const planPayload = {
          product_id: product.id,
          name: config.name,
          description: config.description,
          status: "ACTIVE",
          billing_cycles: [
            {
              frequency: {
                interval_unit: config.interval_unit,
                interval_count: config.interval_count
              },
              tenure_type: "REGULAR",
              sequence: 1,
              total_cycles: config.total_cycles,
              pricing_scheme: {
                fixed_price: {
                  value: config.price,
                  currency_code: "USD"
                }
              }
            }
          ],
          payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee_failure_action: "CONTINUE",
            payment_failure_threshold: 3
          },
          taxes: {
            percentage: "0",
            inclusive: false
          }
        };

        const plan = await getOrCreatePayPalPlan(accessToken, planPayload, tier);
        console.log(`✅ Plan created for ${tier}:`, plan.id);

        results.push({
          tier,
          productId: product.id,
          planId: plan.id,
          name: config.name,
          price: config.price,
          interval: `${config.interval_count} ${config.interval_unit}`,
          recurring: config.total_cycles === 0
        });

      } catch (error) {
        console.error(`❌ Failed to create ${tier} plan:`, error);
        results.push({
          tier,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('📋 Plan setup results:', results);

    return NextResponse.json({
      success: true,
      message: 'PayPal subscription plans setup completed',
      plans: results,
      instructions: [
        'Add the following environment variables to your .env.local file:',
        ...results
          .filter(r => r.planId)
          .map(r => `PAYPAL_${r.tier.toUpperCase()}_PLAN_ID=${r.planId}`)
      ]
    });

  } catch (error) {
    console.error('❌ PayPal plans setup failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to setup PayPal subscription plans', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
