import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/utils/supabase/admin';
import { verifyAdminAccess } from '../utils';

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

    // Calculate monthly statistics for new entities (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const monthlyLabels: string[] = [];
    const monthlyNewUsers: number[] = [];
    const monthlyNewDocuments: number[] = [];
    const monthlyNewContacts: number[] = [];
    const monthlyNewReps: number[] = [];
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(threeMonthsAgo);
      date.setMonth(date.getMonth() + i);
      
      const monthName = date.toLocaleString('default', { month: 'short' });
      monthlyLabels.push(monthName);
      
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const monthRange = {
        gte: startOfMonth.toISOString(),
        lte: endOfMonth.toISOString()
      };
      
      // Get new users for this month (excluding admins)
      const { count: newUsers } = await adminClient
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthRange.gte)
        .lte('created_at', monthRange.lte)
        .neq('role', 'admin');
      monthlyNewUsers.push(newUsers || 0);
      
      // Get new documents for this month
      const { count: newDocs } = await adminClient
        .from('document_locations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthRange.gte)
        .lte('created_at', monthRange.lte);
      monthlyNewDocuments.push(newDocs || 0);
      
      // Get new contacts for this month
      const { count: newContacts } = await adminClient
        .from('user_emergency_contacts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthRange.gte)
        .lte('created_at', monthRange.lte);
      monthlyNewContacts.push(newContacts || 0);
      
      // Get new representatives for this month
      const { count: newReps } = await adminClient
        .from('user_authorized_representatives')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthRange.gte)
        .lte('created_at', monthRange.lte);
      monthlyNewReps.push(newReps || 0);
    }

    return NextResponse.json({
      labels: monthlyLabels,
      newUsers: monthlyNewUsers,
      newDocuments: monthlyNewDocuments,
      newEmergencyContacts: monthlyNewContacts,
      newRepresentatives: monthlyNewReps
    });
  } catch (error) {
    console.error('Error fetching monthly stats analytics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
