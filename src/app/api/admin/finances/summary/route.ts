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

    // Get total revenue
    const { data: totalRevenueData } = await adminClient
      .from('payment_transactions')
      .select('amount')
      .eq('payment_status', 'completed');
    
    const totalRevenue = totalRevenueData?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0;

    // Get transaction count
    const { count: transactionCount } = await adminClient
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true });

    // Get active subscription plans
    const { count: activeSubscriptionPlans } = await adminClient
      .from('paypal_subscription_plans')
      .select('*', { count: 'exact', head: true });

    // Get successful transactions
    const { count: successfulTransactions } = await adminClient
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'completed');

    // Get failed transactions
    const { count: failedTransactions } = await adminClient
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'failed');

    // Get pending transactions
    const { count: pendingTransactions } = await adminClient
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'pending');

    // Get current month revenue
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString();
    
    const { data: currentMonthData } = await adminClient
      .from('payment_transactions')
      .select('amount')
      .eq('payment_status', 'completed')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth);
    
    const currentMonthRevenue = currentMonthData?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0;

    // Get previous month revenue
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const startOfPrevMonth = new Date(prevYear, prevMonth, 1).toISOString();
    const endOfPrevMonth = new Date(prevYear, prevMonth + 1, 0).toISOString();
    
    const { data: previousMonthData } = await adminClient
      .from('payment_transactions')
      .select('amount')
      .eq('payment_status', 'completed')
      .gte('created_at', startOfPrevMonth)
      .lte('created_at', endOfPrevMonth);
    
    const previousMonthRevenue = previousMonthData?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0;

    // Calculate growth
    const revenueGrowth = previousMonthRevenue === 0 ? 100 :
      ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

    // Calculate average transaction value
    const avgTransactionValue = (successfulTransactions === 0 || !successfulTransactions) ? 0 : 
      totalRevenue / successfulTransactions;

    return NextResponse.json({
      totalRevenue,
      transactionCount: transactionCount || 0,
      avgTransactionValue,
      activeSubscriptionPlans: activeSubscriptionPlans || 0,
      successfulTransactions: successfulTransactions || 0,
      failedTransactions: failedTransactions || 0,
      pendingTransactions: pendingTransactions || 0,
      currentMonthRevenue,
      previousMonthRevenue,
      revenueGrowth
    });
  } catch (error) {
    console.error('Error fetching finances summary:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
