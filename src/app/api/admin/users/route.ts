import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/app/utils/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    // For admin APIs, use service role key directly to bypass auth checks
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

    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*");

    if (usersError) {
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Fetch all subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("user_subscription")
      .select("*");

    if (subscriptionsError) {
      // Continue with users but without subscription data
    }

    // Map subscriptions to users
    const usersWithSubscriptions = users.map(user => {
      // Find the most recent subscription for this user
      const userSubscriptions = subscriptions?.filter(sub => sub.user_id === user.id) || [];
      const latestSubscription = userSubscriptions.length > 0 
        ? userSubscriptions.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
        : null;
      
      return {
        ...user,
        subscription: latestSubscription ? {
          level: latestSubscription.subscription_level,
          status: latestSubscription.status,
          end_date: latestSubscription.end_date
        } : undefined
      };
    });

    return NextResponse.json({ users: usersWithSubscriptions, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
