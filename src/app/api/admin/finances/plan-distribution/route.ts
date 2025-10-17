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

    // Get subscription distribution
    const { data: transactions } = await adminClient
      .from('payment_transactions')
      .select('subscription_level, amount')
      .eq('payment_status', 'completed');
    
    // Group by subscription level
    const planCounts = new Map();
    const planRevenue = new Map();
    let total = 0;
    
    transactions?.forEach((tx: any) => {
      const level = tx.subscription_level;
      planCounts.set(level, (planCounts.get(level) || 0) + 1);
      planRevenue.set(level, (planRevenue.get(level) || 0) + tx.amount);
      total++;
    });
    
    // Format for chart data
    const labels = Array.from(planCounts.keys());
    const data = labels.map(level => planCounts.get(level) || 0);
    const percentages = total === 0 ? labels.map(() => 0) :
      labels.map(level => Math.round((planCounts.get(level) / total) * 100));
    const revenue = labels.map(level => planRevenue.get(level) || 0);
    
    return NextResponse.json({ labels, data, percentages, revenue });
  } catch (error) {
    console.error('Error fetching plan distribution:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
