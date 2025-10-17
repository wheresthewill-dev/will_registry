import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/app/utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Initialize Supabase client with cookies
    const supabase = createAdminClient();

    // Fetch financial data
    const financesData = await fetchFinancesData(supabase);

    revalidatePath('/api/admin/finances');

    return NextResponse.json({
      data: financesData,
      lastRefreshed: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in finances API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Fetch all finances data from the database
 */
async function fetchFinancesData(supabase: any) {
  try {
    // Fetch summary data
    const summaryData = await fetchSummaryData(supabase);
    
    // Fetch revenue by month
    const revenueByMonth = await fetchRevenueByMonth(supabase);
    
    // Fetch subscription plan distribution
    const planDistribution = await fetchPlanDistribution(supabase);
    
    // Fetch payment status distribution
    const paymentStatus = await fetchPaymentStatus(supabase);
    
    // Fetch subscription plans
    const { data: subscriptionPlans } = await supabase
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

    // Fetch recent transactions
    const { data: recentTransactions } = await supabase
      .from('payment_transactions')
      .select('*, users(email)')
      .order('created_at', { ascending: false })
      .limit(20);
    
    // Format recent transactions
    const formattedTransactions = recentTransactions?.map((tx: any) => ({
      id: tx.id,
      userId: tx.user_id,
      userEmail: tx.users?.email || 'Unknown',
      transactionId: tx.transaction_id,
      paymentMethod: tx.payment_method,
      amount: tx.amount,
      currency: tx.currency,
      subscriptionLevel: tx.subscription_level,
      paymentStatus: tx.payment_status,
      processedAt: tx.processed_at,
      createdAt: tx.created_at
    })) || [];

    return {
      summary: summaryData,
      revenueByMonth,
      planDistribution,
      paymentStatus,
      subscriptionPlans: formattedSubscriptionPlans,
      recentTransactions: formattedTransactions
    };

  } catch (error) {
    console.error('Error fetching finances data:', error);
    throw error;
  }
}

/**
 * Fetch summary data
 */
async function fetchSummaryData(supabase: any) {
  // Get total revenue
  const { data: totalRevenueData } = await supabase
    .from('payment_transactions')
    .select('amount')
    .eq('payment_status', 'completed');
  
  const totalRevenue = totalRevenueData?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0;

  // Get transaction count
  const { count: transactionCount } = await supabase
    .from('payment_transactions')
    .select('*', { count: 'exact', head: true });

  // Get active subscription plans
  const { count: activeSubscriptionPlans } = await supabase
    .from('paypal_subscription_plans')
    .select('*', { count: 'exact', head: true });

  // Get successful transactions
  const { count: successfulTransactions } = await supabase
    .from('payment_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'completed');

  // Get failed transactions
  const { count: failedTransactions } = await supabase
    .from('payment_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'failed');

  // Get pending transactions
  const { count: pendingTransactions } = await supabase
    .from('payment_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'pending');

  // Get current month revenue
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString();
  
  const { data: currentMonthData } = await supabase
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
  
  const { data: previousMonthData } = await supabase
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
  const avgTransactionValue = successfulTransactions === 0 ? 0 : 
    totalRevenue / successfulTransactions;

  return {
    totalRevenue,
    transactionCount,
    avgTransactionValue,
    activeSubscriptionPlans,
    successfulTransactions,
    failedTransactions,
    pendingTransactions,
    currentMonthRevenue,
    previousMonthRevenue,
    revenueGrowth
  };
}

/**
 * Fetch revenue by month
 */
async function fetchRevenueByMonth(supabase: any) {
  // Get data for the last 12 months
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 11);
  
  const { data: monthlyTransactions } = await supabase
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
  return {
    labels: monthLabels,
    data: monthLabels.map(month => revenueByMonth.get(month) || 0)
  };
}

/**
 * Fetch subscription plan distribution
 */
async function fetchPlanDistribution(supabase: any) {
  // Get subscription distribution
  const { data: transactions } = await supabase
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
  
  return { labels, data, percentages, revenue };
}

/**
 * Fetch payment status distribution
 */
async function fetchPaymentStatus(supabase: any) {
  // Get payment status distribution
  const { data: statusData } = await supabase
    .from('payment_transactions')
    .select('payment_status, count')
    .select()
    .limit(1000);
  
  // Count status occurrences
  const statusCounts = new Map();
  statusData?.forEach((tx: any) => {
    const status = tx.payment_status;
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  });
  
  const total = statusData?.length || 0;
  
  // Format for chart data
  const labels = Array.from(statusCounts.keys());
  const data = labels.map(status => statusCounts.get(status) || 0);
  const percentages = total === 0 ? labels.map(() => 0) :
    labels.map(status => Math.round((statusCounts.get(status) / total) * 100));
  
  return { labels, data, percentages };
}
