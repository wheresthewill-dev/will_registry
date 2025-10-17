import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/utils/supabase/admin';
import { verifyAdminAccess } from '../../analytics/utils';

const adminClient = createAdminClient();

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminCheck = await verifyAdminAccess(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    // Fetch subscription plans
    const { data: subscriptionPlans } = await adminClient
      .from('paypal_subscription_plans')
      .select('*')
      .order('price', { ascending: false });
    
    // Format subscription plans
    const formattedSubscriptionPlans = subscriptionPlans?.map((plan: any) => ({
      id: plan.id,
      planLevel: plan.plan_level,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      billingInterval: plan.billing_interval,
      intervalCount: plan.interval_count,
      totalCycles: plan.total_cycles,
      isRecurring: plan.is_recurring,
      commitmentYears: plan.commitment_years
    })) || [];

    return NextResponse.json(formattedSubscriptionPlans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
