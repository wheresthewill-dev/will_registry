/**
 * API for retrieving emergency contact details by ID
 */
import { createAdminClient } from '@/app/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// Create admin client with service role
const supabaseAdmin = createAdminClient();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const contactId = searchParams.get('contactId');

        if (!contactId) {
            return NextResponse.json(
                { success: false, error: 'Missing contact ID' },
                { status: 400 }
            );
        }

        console.log('🔄 Server: Fetching emergency contact details for ID:', contactId);

        // Fetch the emergency contact record
        const { data: contactData, error: contactError } = await supabaseAdmin
            .from('user_emergency_contacts')
            .select('*')
            .eq('id', contactId)
            .single();

        if (contactError) {
            console.error('❌ Failed to fetch emergency contact:', contactError);
            return NextResponse.json(
                { success: false, error: `Failed to fetch emergency contact: ${contactError.message}` },
                { status: 404 }
            );
        }

        if (!contactData) {
            return NextResponse.json(
                { success: false, error: 'Emergency contact not found' },
                { status: 404 }
            );
        }

        // Return the contact data
        return NextResponse.json({
            success: true,
            contact: contactData
        });
    } catch (error) {
        console.error('❌ Server exception in emergency contact fetch:', error);
        return NextResponse.json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'Unknown server error',
                details: 'Check server logs for more information'
            },
            { status: 500 }
        );
    }
}
