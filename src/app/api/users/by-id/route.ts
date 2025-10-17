import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/utils/supabase/admin";

// Create a Supabase client with service role key for admin operations
const supabase = createAdminClient();

export async function POST(request: NextRequest) {
  console.log("👤 POST /api/users/by-id - Starting user lookup");

  try {
    // Parse the request body
    const body = await request.text();
    console.log("📄 Request body text:", body);

    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
      console.log("✅ Parsed JSON body:", parsedBody);
    } catch (parseError) {
      console.error("❌ Failed to parse JSON:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          details: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    const { user_id } = parsedBody;

    // Validate user_id
    if (!user_id) {
      console.error("❌ Missing user_id in request");
      return NextResponse.json(
        {
          success: false,
          error: "Missing user_id",
          details: "user_id is required in request body",
        },
        { status: 400 }
      );
    }

    // Validate user_id is a number
    const userId = parseInt(user_id.toString());
    if (isNaN(userId)) {
      console.error("❌ Invalid user_id format:", user_id);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user_id format",
          details: "user_id must be a valid number",
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Looking up user with ID: ${userId}`);

    // Query the users table
    const { data: user, error: queryError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (queryError) {
      console.error("❌ Database query error:", queryError);

      // Handle specific error cases
      if (queryError.code === "PGRST116") {
        // No rows returned
        console.log(`ℹ️ User not found with ID: ${userId}`);
        return NextResponse.json(
          {
            success: false,
            found: false,
            error: "User not found",
            details: `No user found with ID: ${userId}`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Database query failed",
          details: queryError.message,
        },
        { status: 500 }
      );
    }

    if (!user) {
      console.log(`ℹ️ User not found with ID: ${userId}`);
      return NextResponse.json(
        {
          success: false,
          found: false,
          error: "User not found",
          details: `No user found with ID: ${userId}`,
        },
        { status: 404 }
      );
    }

    console.log(`✅ User found:`, {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
    });

    // Return the user data (excluding sensitive fields if any)
    const safeUser = {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      middlename: user.middlename,
      created_at: user.created_at,
      updated_at: user.updated_at,
      // Add other safe fields as needed, exclude sensitive ones like passwords
    };

    return NextResponse.json({
      success: true,
      found: true,
      user: safeUser,
    });
  } catch (error) {
    console.error("💥 Unexpected error in /api/users/by-id:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Handle GET requests
export async function GET(request: NextRequest) {
  console.log("👤 GET /api/users/by-id - Starting user lookup");

  try {
    // Get userId from query parameter
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log("🔄 Processing GET request with userId:", userId);

    // Validate user_id
    if (!userId) {
      console.error("❌ Missing userId in query parameters");
      return NextResponse.json(
        {
          success: false,
          error: "Missing userId",
          details: "userId is required as a query parameter",
        },
        { status: 400 }
      );
    }

    // Validate user_id is a number
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      console.error("❌ Invalid userId format:", userId);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid userId format",
          details: "userId must be a valid number",
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Looking up user with ID: ${userIdNum}`);

    // Query the users table
    const { data: user, error: queryError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userIdNum)
      .single();

    if (queryError) {
      console.error("❌ Database query error:", queryError);

      // Handle specific error cases
      if (queryError.code === "PGRST116") {
        // No rows returned
        console.log(`ℹ️ User not found with ID: ${userIdNum}`);
        return NextResponse.json(
          {
            success: false,
            found: false,
            error: "User not found",
            details: `No user found with ID: ${userIdNum}`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Database query failed",
          details: queryError.message,
        },
        { status: 500 }
      );
    }

    if (!user) {
      console.log(`ℹ️ User not found with ID: ${userIdNum}`);
      return NextResponse.json(
        {
          success: false,
          found: false,
          error: "User not found",
          details: `No user found with ID: ${userIdNum}`,
        },
        { status: 404 }
      );
    }

    console.log(`✅ User found:`, {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
    });

    // Return the user data (excluding sensitive fields)
    const safeUser = {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      middlename: user.middlename,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return NextResponse.json({
      success: true,
      found: true,
      user: safeUser,
    });
  } catch (error) {
    console.error("💥 Unexpected error in GET /api/users/by-id:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      details: "Use POST method with user_id in request body",
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      details: "Use POST method with user_id in request body",
    },
    { status: 405 }
  );
}
