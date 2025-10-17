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

    // Get payment status distribution
    const { data: statusData } = await adminClient
      .from('payment_transactions')
      .select('payment_status')
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
    
    return NextResponse.json({ labels, data, percentages });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
