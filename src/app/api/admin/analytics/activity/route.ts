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

    // Get activities from the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: weekActivities } = await adminClient
      .from('recent_activities')
      .select('created_at')
      .gt('created_at', oneWeekAgo.toISOString());
    
    const dayOfWeekData = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
    
    weekActivities?.forEach(activity => {
      const date = new Date(activity.created_at);
      // Convert to 0-6 where 0 is Monday and 6 is Sunday
      const dayIndex = (date.getDay() + 6) % 7;
      dayOfWeekData[dayIndex]++;
    });

    return NextResponse.json({
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: dayOfWeekData
    });
  } catch (error) {
    console.error('Error fetching activity analytics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
