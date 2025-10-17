import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/utils/supabase/admin";

// Create service role client for server-side operations
const supabaseServiceRole = createAdminClient();

export async function GET(request: NextRequest) {
  console.log(
    "🔍 GET /api/users/by-id/representatives - Starting request processing"
  );

  try {
    // Extract userId from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log("📝 Processing GET request with userId:", userId);

    // Validate required fields
    if (!userId) {
      console.error("❌ Missing userId in query parameters");
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    // Query user_authorized_representatives table
    const { data: representatives, error } = await supabaseServiceRole
      .from("user_authorized_representatives")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("❌ Database error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!representatives || representatives.length === 0) {
      console.log("ℹ️ No representatives found for user ID:", userId);
      return NextResponse.json({
        message: "No representatives found for this user",
        representatives: [],
      });
    }

    console.log(
      `✅ Found ${representatives.length} representatives for user ID:`,
      userId
    );
    return NextResponse.json({
      representatives,
    });
  } catch (error) {
    console.error("Error in representatives API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
