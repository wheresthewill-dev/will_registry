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

    // Fetch emergency contacts
    const { data: emergencyContactsData } = await adminClient
      .from('user_emergency_contacts')
      .select('user_id');
    
    // Count contacts per user
    const contactsPerUser: Record<string, number> = {};
    emergencyContactsData?.forEach(contact => {
      const userId = contact.user_id.toString();
      contactsPerUser[userId] = (contactsPerUser[userId] || 0) + 1;
    });
    
    // Calculate distribution of contacts per user
    const contactDistribution = [0, 0, 0, 0, 0, 0]; // 0, 1, 2, 3, 4, 5+
    Object.values(contactsPerUser).forEach(count => {
      if (count >= 5) {
        contactDistribution[5]++;
      } else {
        contactDistribution[count]++;
      }
    });
    
    // Calculate averages
    const totalContactsUsers = Object.keys(contactsPerUser).length;
    const totalContacts = Object.values(contactsPerUser).reduce((sum, count) => sum + count, 0);
    const avgContactsPerUser = totalContactsUsers > 0 ? totalContacts / totalContactsUsers : 0;

    return NextResponse.json({
      average: avgContactsPerUser,
      distribution: {
        labels: ['0', '1', '2', '3', '4', '5+'],
        data: contactDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching emergency contacts analytics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
