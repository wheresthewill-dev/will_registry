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

    // Fetch representatives
    const { data: representativesData } = await adminClient
      .from('user_authorized_representatives')
      .select('user_id');
    
    // Count representatives per user
    const repsPerUser: Record<string, number> = {};
    representativesData?.forEach(rep => {
      const userId = rep.user_id.toString();
      repsPerUser[userId] = (repsPerUser[userId] || 0) + 1;
    });
    
    // Calculate distribution of representatives per user
    const repDistribution = [0, 0, 0, 0, 0, 0]; // 0, 1, 2, 3, 4, 5+
    Object.values(repsPerUser).forEach(count => {
      if (count >= 5) {
        repDistribution[5]++;
      } else {
        repDistribution[count]++;
      }
    });
    
    // Calculate averages
    const totalRepsUsers = Object.keys(repsPerUser).length;
    const totalReps = Object.values(repsPerUser).reduce((sum, count) => sum + count, 0);
    const avgRepsPerUser = totalRepsUsers > 0 ? totalReps / totalRepsUsers : 0;

    return NextResponse.json({
      average: avgRepsPerUser,
      distribution: {
        labels: ['0', '1', '2', '3', '4', '5+'],
        data: repDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching representatives analytics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
