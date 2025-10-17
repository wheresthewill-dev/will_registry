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

    // Fetch recent transactions
    const { data: recentTransactions } = await adminClient
      .from('payment_transactions')
      .select('*, users(email)')
      .order('created_at', { ascending: false })
      .limit(50);
    
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

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
