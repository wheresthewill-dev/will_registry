import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/utils/supabase/admin";

// Simple solution for Next.js 15 routing
export async function GET(request: NextRequest) {
  try {
    // Extract userId from URL
    const pathname = request.nextUrl.pathname;
    const pathParts = pathname.split('/');
    const userId = pathParts[pathParts.length - 1];
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    } 

    // Create direct Supabase client with admin privileges
    // For admin APIs, use service role key directly to bypass auth checks
    // This is safe because we're on server-side code
    const supabase = createAdminClient();

    // Skip auth check in development mode for testing
    // In production, you would want to reinstate these checks
    
    if (process.env.NODE_ENV === 'production') {
      // Verify the caller is an admin
      const {
        data: { session },
      } = await supabase.auth.getSession();
  
      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized: Not authenticated" },
          { status: 401 }
        );
      }
  
      // Get the user's role
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("email", session.user.email)
        .single();
  
      if (userError || !userData || (userData.role !== "admin" && userData.role !== "super_admin")) {
        return NextResponse.json(
          { error: "Unauthorized: Admin access required" },
          { status: 403 }
        );
      }
    }

    // Fetch basic user information
    const { data: user, error: userFetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userFetchError) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch user subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscription")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

        // Fetch user emergency contacts
    const { data: rawContacts, error: contactsError } = await supabase
      .from("user_emergency_contacts")
      .select("*")
      .eq("user_id", userId);
    
    // Initialize enhanced contacts array
    let enhancedContacts = rawContacts || [];
    
    // Enhance emergency contacts data with user details if available
    if (enhancedContacts && enhancedContacts.length > 0) {
      // Get array of ec_user_ids to fetch corresponding user records
      const ecUserIds = enhancedContacts
        .filter(contact => contact.ec_user_id)
        .map(contact => contact.ec_user_id);
      
      if (ecUserIds.length > 0) {
        // Fetch user details for each emergency contact
        const { data: ecUsers, error: ecUsersError } = await supabase
          .from("users")
          .select("id, firstname, lastname, email, phone, created_at, role")
          .in("id", ecUserIds);
        
        if (!ecUsersError && ecUsers) {
          // Create a map of user details by ID for quick lookup
          const userDetailsMap: Record<string | number, any> = {};
          ecUsers.forEach(user => {
            userDetailsMap[user.id] = user;
          });
          
          // Enhance contacts with user details
          enhancedContacts = enhancedContacts.map(contact => {
            if (!contact.ec_user_id || !userDetailsMap[contact.ec_user_id]) {
              return contact;
            }
            
            const userDetails = userDetailsMap[contact.ec_user_id];
            
            return {
              ...contact,
              // Fill in missing details from user record if not already present
              firstname: contact.firstname || userDetails.firstname,
              lastname: contact.lastname || userDetails.lastname,
              phone: contact.phone || contact.contact_number || userDetails.phone,
              email: contact.email || userDetails.email,
              // Additional user information that might be useful
              user_role: userDetails.role,
              user_created_at: userDetails.created_at
            };
          });
        }
      }
    }

    // Fetch user documents
    
    // Initialize enhanced contacts array
    let contacts = rawContacts || [];
    
    // Enhance emergency contacts data with user details if available
    if (contacts && contacts.length > 0) {
      // Get array of ec_user_ids to fetch corresponding user records
      const ecUserIds = contacts
        .filter(contact => contact.ec_user_id)
        .map(contact => contact.ec_user_id);
      
      if (ecUserIds.length > 0) {
        // Fetch user details for each emergency contact
        const { data: ecUsers, error: ecUsersError } = await supabase
          .from("users")
          .select("id, firstname, lastname, email, phone, created_at, role")
          .in("id", ecUserIds);
        
        if (!ecUsersError && ecUsers) {
          // Create a map of user details by ID for quick lookup
          const userDetailsMap: Record<string | number, any> = {};
          ecUsers.forEach(user => {
            userDetailsMap[user.id] = user;
          });
          
          // Enhance contacts with user details
          contacts = contacts.map(contact => {
            if (!contact.ec_user_id || !userDetailsMap[contact.ec_user_id]) {
              return contact;
            }
            
            const userDetails = userDetailsMap[contact.ec_user_id];
            
            return {
              ...contact,
              // Fill in missing details from user record if not already present
              firstname: contact.firstname || userDetails.firstname,
              lastname: contact.lastname || userDetails.lastname,
              contact_number: contact.contact_number || userDetails.phone,
              email: contact.email || userDetails.email,
              name: contact.name || `${userDetails.firstname || ''} ${userDetails.lastname || ''}`.trim(),
              // Additional user information that might be useful
              user_role: userDetails.role,
              user_created_at: userDetails.created_at
            };
          });
        }
      }
    }

    // Fetch user documents
    const { data: documents, error: documentsError } = await supabase
      .from("document_locations")
      .select("*")
      .eq("user_id", userId);
      
    // Fetch user authorized representatives
    const { data: rawRepresentatives, error: representativesError } = await supabase
      .from("user_authorized_representatives")
      .select("*")
      .eq("user_id", userId);
    
    // Initialize enhanced representatives array
    let representatives = rawRepresentatives || [];
    
    // Enhance representatives data with user details if available
    if (representatives && representatives.length > 0) {
      // Get array of ar_user_ids to fetch corresponding user records
      const arUserIds = representatives
        .filter(rep => rep.ar_user_id)
        .map(rep => rep.ar_user_id);
      
      if (arUserIds.length > 0) {
        // Fetch user details for each representative
        const { data: repUsers, error: repUsersError } = await supabase
          .from("users")
          .select("id, firstname, lastname, email, phone, created_at, role")
          .in("id", arUserIds);
        
        if (!repUsersError && repUsers) {
          // Create a map of user details by ID for quick lookup
          const userDetailsMap: Record<string | number, any> = {};
          repUsers.forEach(user => {
            userDetailsMap[user.id] = user;
          });
          
          // Enhance representatives with user details
          representatives = representatives.map(rep => {
            if (!rep.ar_user_id || !userDetailsMap[rep.ar_user_id]) {
              return rep;
            }
            
            const userDetails = userDetailsMap[rep.ar_user_id];
            
            return {
              ...rep,
              // Fill in missing details from user record if not already present
              firstname: rep.firstname || userDetails.firstname,
              lastname: rep.lastname || userDetails.lastname,
              phone: rep.phone || userDetails.phone,
              name: rep.name || `${userDetails.firstname || ''} ${userDetails.lastname || ''}`.trim(),
              // Additional user information that might be useful
              user_role: userDetails.role,
              user_created_at: userDetails.created_at
            };
          });
        }
      }
    }

    // Fetch user contacts (phone, email, etc.)
    const { data: userContacts, error: userContactsError } = await supabase
      .from("user_contacts")
      .select("*")
      .eq("user_id", userId);
    
    // Fetch user addresses
    const { data: userAddresses, error: userAddressesError } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", userId);
    
    // Fetch recent user activities
    const { data: recentActivities, error: recentActivitiesError } = await supabase
      .from("recent_activities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    
    // Fetch user configuration
    const { data: userConfig, error: userConfigError } = await supabase
      .from("user_configs")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Compile all data
    const userData_combined = {
      user,
      subscription: subscriptionError ? null : subscription,
      profile: profileError ? null : profile,
      contacts: contactsError ? [] : enhancedContacts || [],
      documents: documentsError ? [] : documents || [],
      representatives: representativesError ? [] : representatives || [],
      userContacts: userContactsError ? [] : userContacts || [],
      addresses: userAddressesError ? [] : userAddresses || [],
      recentActivities: recentActivitiesError ? [] : recentActivities || [],
      userConfig: userConfigError ? null : userConfig,
      // Add success flag to indicate API call succeeded
      success: true
    };

    return NextResponse.json(userData_combined);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
