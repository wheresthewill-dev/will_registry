import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/utils/supabase/admin';
import { verifyAdminAccess } from '../utils';
import { SubscriptionLevel } from '@/app/utils/repo_services/interfaces/user_subscription';

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

    // Fetch subscription distribution
    const { data: subscriptionsData } = await adminClient
      .from('user_subscription')
      .select('subscription_level')
      .eq('is_active', true);
    
    const subscriptionCounts: Record<SubscriptionLevel, number> = {
      bronze: 0,
      silver: 0, 
      gold: 0,
      platinum: 0
    };
    
    subscriptionsData?.forEach((sub: any) => {
      const level = sub.subscription_level as SubscriptionLevel;
      if (level) subscriptionCounts[level]++;
    });
    
    const subscriptionLabels = Object.keys(subscriptionCounts);
    const subscriptionData = Object.values(subscriptionCounts);
    const totalSubscriptions = subscriptionData.reduce((sum, count) => sum + count, 0);
    const subscriptionPercentages = subscriptionData.map(count => 
      totalSubscriptions > 0 ? Math.round((count / totalSubscriptions) * 100) : 0
    );

    return NextResponse.json({
      labels: subscriptionLabels,
      data: subscriptionData,
      percentages: subscriptionPercentages
    });
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
