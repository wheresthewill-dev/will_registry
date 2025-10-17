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

    // Get current date for time-based queries
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(now.getDate() - 1);
    
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);

    // Fetch all summary statistics in parallel
    const [
      usersResponse,
      subscriptionsResponse,
      documentsResponse,
      emergencyContactsResponse,
      representativesResponse,
      loginsResponse,
      recentUsersResponse,
      activitiesResponse,
    ] = await Promise.all([
      // Total users (excluding admins)
      adminClient
        .from('users')
        .select('*', { count: 'exact', head: true })
        .neq('role', 'admin'),
      
      // Active subscriptions (excluding bronze)
      adminClient
        .from('user_subscription')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .neq('subscription_level', 'bronze'),
      
      // Total documents
      adminClient
        .from('document_locations')
        .select('*', { count: 'exact', head: true }),
      
      // Total emergency contacts
      adminClient
        .from('user_emergency_contacts')
        .select('*', { count: 'exact', head: true }),
      
      // Total representatives
      adminClient
        .from('user_authorized_representatives')
        .select('*', { count: 'exact', head: true }),
      
      // Recent logins (last 24 hours)
      adminClient
        .from('user_logins')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', oneDayAgo.toISOString()),
      
      // Recently created users (last 7 days, excluding admins)
      adminClient
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', oneWeekAgo.toISOString())
        .neq('role', 'admin'),
      
      // Recent activities (last 30 days)
      adminClient
        .from('recent_activities')
        .select('*', { count: 'exact', head: true })
    ]);

    // Calculate average documents per user
    const totalDocs = documentsResponse.count || 0;
    const totalUsersCount = usersResponse.count || 1; // Avoid division by zero
    const avgDocsPerUser = totalDocs / totalUsersCount;

    // Return summary statistics
    return NextResponse.json({
      totalUsers: usersResponse.count || 0,
      activeSubscriptions: subscriptionsResponse.count || 0,
      totalDocuments: documentsResponse.count || 0,
      totalEmergencyContacts: emergencyContactsResponse.count || 0,
      totalRepresentatives: representativesResponse.count || 0,
      recentLogins: loginsResponse.count || 0,
      recentlyCreatedUsers: recentUsersResponse.count || 0,
      recentActivities: activitiesResponse.count || 0,
      averageDocumentsPerUser: avgDocsPerUser
    });
  } catch (error) {
    console.error('Error fetching summary analytics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
