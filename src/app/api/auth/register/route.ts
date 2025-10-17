/**
 * Server-side API route for user registration
 * This route creates both the Supabase auth user and all related user records
 * then automatically logs in the user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/utils/supabase/admin';
import { v4 as uuidv4 } from 'uuid';

// Create admin client with service role
const supabaseAdmin = createAdminClient();

// Registration data interface
interface RegistrationData {
    email: string;
    password: string;
    username: string;
    firstname: string;
    lastname: string;
    middlename?: string;
    contacts: {
        type: string;
        value: string;
    }[];
    birthInfo: {
        country: string;
        town: string;
        birthDate: string; // ISO date string
    };
    address: {
        type: string;
        address_line: string;
        country: string;
        post_code?: string;
        state?: string;
        town?: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: RegistrationData = await request.json();
        const { email, password, username, firstname, lastname, middlename, contacts, birthInfo, address } = body;

        console.log('🔄 Server: Starting user registration...');
        console.log('📧 Email:', email);
        console.log('👤 Name:', `${firstname} ${lastname}`);

        // Validate required fields
        if (!email || !password || !username || !firstname || !lastname || !contacts || !birthInfo || !address) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 1. Create Supabase auth user
        console.log('🔐 Creating Supabase auth user...');
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                firstname: firstname,
                lastname: lastname,
                username: username,
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
                middlename: middlename,
                username: username,
                role: 'user'
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

        try {
            // 3. Insert user contacts
            console.log('🔄 Creating user contacts...');
            for (const contact of contacts) {
                const { error: contactError } = await supabaseAdmin
                    .from('user_contacts')
                    .insert({
                        id: uuidv4(),
                        type: contact.type,
                        value: contact.value,
                        user_id: userId
                    });

                if (contactError) {
                    throw new Error(`Contact insert error: ${contactError.message}`);
                }
            }
            console.log('✅ User contacts created successfully');

            // 4. Insert user birth info
            console.log('🔄 Creating user birth info...');
            const { error: birthInfoError } = await supabaseAdmin
                .from('user_birth_info')
                .insert({
                    id: uuidv4(),
                    country: birthInfo.country,
                    town: birthInfo.town,
                    birthdate: birthInfo.birthDate,
                    user_id: userId
                });

            if (birthInfoError) {
                throw new Error(`Birth info insert error: ${birthInfoError.message}`);
            }
            console.log('✅ User birth info created successfully');

            // 5. Insert user address
            console.log('🔄 Creating user address...');
            const { error: addressError } = await supabaseAdmin
                .from('user_addresses')
                .insert({
                    id: uuidv4(),
                    type: address.type,
                    address_line: address.address_line,
                    country: address.country,
                    post_code: address.post_code,
                    state: address.state,
                    town: address.town,
                    user_id: userId
                });

            if (addressError) {
                throw new Error(`Address insert error: ${addressError.message}`);
            }
            console.log('✅ User address created successfully');

        } catch (dataError) {
            console.error('❌ Failed to create user data records:', dataError);
            
            // Cleanup: Delete auth user and user record
            console.log('🧹 Cleaning up auth user and user record due to data creation failure...');
            await supabaseAdmin.auth.admin.deleteUser(authUserId);
            await supabaseAdmin.from('users').delete().eq('id', userId);
            
            return NextResponse.json(
                { error: `Failed to create user data: ${dataError instanceof Error ? dataError.message : 'Unknown error'}` },
                { status: 500 }
            );
        }

        // 6. Generate session for the newly created user
        console.log('🔄 Generating session for new user...');
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
            }
        });

        if (sessionError) {
            console.error('❌ Session generation failed:', sessionError);
            console.warn('⚠️ User created successfully but session generation failed');
            // Don't fail the registration for session issues
        }

        console.log('🎉 User registration completed successfully!');
        console.log(`📋 Summary: Auth ID: ${authUserId}, User ID: ${userId}`);

        // Return success with session data if available
        const response: any = {
            success: true,
            userId: userId.toString(),
            authUserId: authUserId,
            message: 'User registered successfully'
        };

        if (sessionData && !sessionError) {
            response.loginUrl = sessionData.properties?.action_link;
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('❌ Server exception in user registration:', error);
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : 'Unknown server error',
                details: 'Check server logs for more information'
            },
            { status: 500 }
        );
    }
}
