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

    // Fetch recent activities for display
    const { data: recentActivitiesList } = await adminClient
      .from('recent_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100); // Limit to last 100 activities
    
    const formattedActivities = recentActivitiesList?.map(activity => ({
      id: activity.id,
      description: activity.description,
      timestamp: activity.created_at,
      type: activity.activity_type,
      tableName: activity.table_name
    })) || [];

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
