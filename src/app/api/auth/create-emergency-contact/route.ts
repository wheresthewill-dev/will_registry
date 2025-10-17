/**
 * Server-side API route for creating emergency contact auth accounts
 * This route creates both the Supabase auth user and the user record
 * without affecting the current user's session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/utils/supabase/admin';

// Create admin client with service role
const supabaseAdmin = createAdminClient();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, firstname, lastname, relationship } = body;

        console.log('🔄 Server: Creating emergency contact auth account...');
        console.log('📧 Email:', email);
        console.log('👤 Name:', `${firstname} ${lastname}`);
        console.log('🔗 Relationship:', relationship);

        // Validate input
        if (!email || !password || !firstname || !lastname || !relationship) {
            return NextResponse.json(
                { error: 'Missing required fields: email, password, firstname, lastname, relationship' },
                { status: 400 }
            );
        }

        // 1. Create Supabase auth user
        console.log('🔐 Creating Supabase auth user...');
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto-confirm email for emergency contacts
            user_metadata: {
                firstname: firstname,
                lastname: lastname,
                role: 'user'
            }
        });

        if (authError) {
            console.error('❌ Auth user creation failed:', authError);
            return NextResponse.json(
                { error: `Failed to create auth user: ${authError.message}` },
                { status: 400 }
            );
        }

        if (!authData.user) {
            console.error('❌ No user data returned from auth creation');
            return NextResponse.json(
                { error: 'Failed to create auth user: No user data returned' },
                { status: 500 }
            );
        }

        const authUserId = authData.user.id;
        console.log('✅ Auth user created with ID:', authUserId);

        // 2. Create user record in users table
        console.log('🔄 Creating user record in users table...');
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .insert({
                auth_uid: authUserId,
                email: email,
                firstname: firstname,
                lastname: lastname,
                role: 'user',
            })
            .select('id')
            .single();

        if (userError) {
            console.error('❌ User record creation failed:', userError);
            
            // Cleanup: Delete the auth user if user record creation fails
            console.log('🧹 Cleaning up auth user due to user record failure...');
            await supabaseAdmin.auth.admin.deleteUser(authUserId);
            
            return NextResponse.json(
                { error: `Failed to create user record: ${userError.message}` },
                { status: 500 }
            );
        }

        if (!userData) {
            console.error('❌ No user data returned from user record creation');
            
            // Cleanup: Delete the auth user
            console.log('🧹 Cleaning up auth user due to missing user data...');
            await supabaseAdmin.auth.admin.deleteUser(authUserId);
            
            return NextResponse.json(
                { error: 'Failed to create user record: No user data returned' },
                { status: 500 }
            );
        }

        const userId = userData.id;
        console.log('✅ User record created with ID:', userId);

        console.log('🎉 Emergency contact auth account created successfully!');
        console.log(`📋 Summary: Auth ID: ${authUserId}, User ID: ${userId}`);

        return NextResponse.json({
            success: true,
            userId: userId.toString(),
            authUserId: authUserId,
            message: 'Emergency contact auth account created successfully'
        });

    } catch (error) {
        console.error('❌ Server exception in emergency contact creation:', error);
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : 'Unknown server error',
                details: 'Check server logs for more information'
            },
            { status: 500 }
        );
    }
}
