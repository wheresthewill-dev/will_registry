import { createAdminClient } from '@/app/utils/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from "next/server";

/**
 * Handler for GET and PUT requests to /api/app-config
 * Uses SERVICE_ROLE_KEY for admin-level access to the app_config table
 */
export async function GET(req: NextRequest) {
  try {
    // Create Supabase client with service role for admin access
    const supabaseAdmin = createAdminClient();

    // Get the first (and typically only) record from the app_config table
    const { data, error } = await supabaseAdmin
      .from("app_config")
      .select("*")
      .order("id")
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching app config:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch application configuration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Unexpected error in app-config GET:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Create Supabase client with service role for admin access
    const supabaseAdmin = createAdminClient();

    // Parse the request body
    const updates = await req.json();

    // Validate the updates
    const validFields = [
      "business_address",
      "business_contact",
      "customer_support_email",
    ];
    
    // Filter out any fields that aren't in our valid fields list
    const validUpdates = Object.keys(updates)
      .filter(key => validFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as Record<string, any>);

    // Get the first record to update
    const { data: existingConfig, error: fetchError } = await supabaseAdmin
      .from("app_config")
      .select("id")
      .order("id")
      .limit(1)
      .single();

    if (fetchError) {
      console.error("Error fetching existing app config:", fetchError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch application configuration" },
        { status: 500 }
      );
    }

    // Update the record
    const { data, error } = await supabaseAdmin
      .from("app_config")
      .update(validUpdates)
      .eq("id", existingConfig.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating app config:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update application configuration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Unexpected error in app-config PUT:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
