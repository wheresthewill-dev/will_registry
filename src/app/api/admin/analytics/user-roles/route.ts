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

    // Fetch user roles distribution (including admins for role analysis)
    const { data: userRoles } = await adminClient
      .from('users')
      .select('role, id');
    
    const roleCounts: Record<string, number> = {};
    userRoles?.forEach(user => {
      const role = user.role || 'user';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    const roleLabels = Object.keys(roleCounts);
    const roleData = Object.values(roleCounts);
    const totalUsers = roleData.reduce((sum, count) => sum + count, 0);
    const rolePercentages = roleData.map(count => 
      totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
    );

    return NextResponse.json({
      labels: roleLabels,
      data: roleData,
      percentages: rolePercentages
    });
  } catch (error) {
    console.error('Error fetching user roles analytics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
