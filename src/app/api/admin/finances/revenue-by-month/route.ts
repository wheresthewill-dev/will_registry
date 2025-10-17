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

    // Get data for the last 12 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    
    const { data: monthlyTransactions } = await adminClient
      .from('payment_transactions')
      .select('amount, created_at')
      .eq('payment_status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Organize by month
    const revenueByMonth = new Map();
    const monthLabels = [];
    
    // Initialize all months with 0
    for (let i = 0; i < 12; i++) {
      const d = new Date(startDate);
      d.setMonth(startDate.getMonth() + i);
      const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthLabels.push(monthLabel);
      revenueByMonth.set(monthLabel, 0);
    }
    
    // Aggregate revenue by month
    monthlyTransactions?.forEach((tx: any) => {
      const date = new Date(tx.created_at);
      const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (revenueByMonth.has(monthLabel)) {
        revenueByMonth.set(monthLabel, revenueByMonth.get(monthLabel) + tx.amount);
      }
    });
    
    // Convert to arrays for chart data
    return NextResponse.json({
      labels: monthLabels,
      data: monthLabels.map(month => revenueByMonth.get(month) || 0)
    });
  } catch (error) {
    console.error('Error fetching revenue by month:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
