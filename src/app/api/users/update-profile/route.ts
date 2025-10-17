import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/utils/supabase/admin";

export async function PATCH(request: NextRequest) {
  try {
    console.log("📝 [API] Profile update request received");

    // Parse the request body
    const body = await request.json();
    const { field, value, currentPassword, userId } = body;

    console.log(`🔄 [API] Request to update ${field} for user ${userId}`);

    // Validate body
    if (!field || !value || !userId) {
      console.error("❌ [API] Missing required fields in request");
      return NextResponse.json(
        { error: "Missing required fields (field, value, userId)" },
        { status: 400 }
      );
    }

    // For sensitive operations, require current password
    if (
      (field === "email" || field === "username" || field === "password") &&
      !currentPassword
    ) {
      console.error(
        `❌ [API] Current password required for ${field} update but was not provided`
      );
      return NextResponse.json(
        { error: "Current password is required for this operation" },
        { status: 400 }
      );
    }

    // Create admin client for operations
    console.log("🔌 [API] Creating admin client for database operations");
    const supabaseAdmin = createAdminClient();

    // First, get the user from the database to find their auth_uid
    console.log("🔍 [API] Looking up user in database with ID:", userId);
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from("users")
      .select("auth_uid, email")
      .eq("id", userId)
      .single();

    if (dbError || !dbUser || !dbUser.auth_uid) {
      console.error("❌ [API] User not found in database:", dbError?.message);
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Now get the auth user with the auth_uid
    console.log(
      "🔍 [API] Verifying user exists in auth with auth_uid:",
      dbUser.auth_uid
    );
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(dbUser.auth_uid);

    if (userError || !userData) {
      console.error("❌ [API] User not found in auth:", userError?.message);
      return NextResponse.json(
        { error: "User not found in authentication system" },
        { status: 404 }
      );
    }

    console.log("✅ [API] User verified:", userData.user.email);

    // If sensitive operation requires password verification
    if (
      (field === "email" || field === "username" || field === "password") &&
      currentPassword
    ) {
      console.log("🔐 [API] Verifying password for sensitive operation...");
      try {
        // Use admin signInWithPassword to verify without affecting the user's current session
        const tempClient = await supabaseAdmin.auth.signInWithPassword({
          email: dbUser.email || userData.user.email || "",
          password: currentPassword,
        });

        if (tempClient.error) {
          console.error(
            "❌ [API] Password verification failed:",
            tempClient.error.message
          );
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 403 }
          );
        }

        console.log(
          "✅ [API] Password verified successfully for",
          field,
          "change"
        );
      } catch (error) {
        console.error("❌ [API] Error during password verification:", error);
        return NextResponse.json(
          { error: "Failed to verify password" },
          { status: 500 }
        );
      }
    } else if (
      field === "email" ||
      field === "username" ||
      field === "password"
    ) {
      // This should not happen as we've already checked for missing password above
      // But adding as a safety check
      console.error(`❌ [API] Current password required for ${field} update`);
      return NextResponse.json(
        { error: "Current password is required for this operation" },
        { status: 400 }
      );
    }
    let result;

    switch (field) {
      case "email":
        console.log("📧 [API] Updating email address to:", value);

        // First check if email already exists in users table
        console.log("🔍 [API] Checking if email already exists in database...");
        const { data: existingEmail, error: emailLookupError } =
          await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", value)
            .neq("id", userId)
            .single();

        if (existingEmail) {
          console.error("❌ [API] Email already in use by another account");
          return NextResponse.json(
            { error: "This email is already associated with another account" },
            { status: 409 }
          );
        }

        // Update email through Supabase Auth
        const { error: emailError } =
          await supabaseAdmin.auth.admin.updateUserById(dbUser.auth_uid, {
            email: value,
          });

        if (emailError) {
          console.error("❌ [API] Email update failed:", emailError);

          // Check if error message suggests duplicate email
          if (
            emailError.message?.includes("already in use") ||
            emailError.message?.includes("already registered") ||
            emailError.message?.includes("duplicate")
          ) {
            return NextResponse.json(
              {
                error: "This email is already associated with another account",
              },
              { status: 409 }
            );
          }

          return NextResponse.json(
            { error: `Failed to update email: ${emailError.message}` },
            { status: 500 }
          );
        }

        // Update email in the users database table too
        console.log(
          `📝 [API] Updating email in database table for user ID: ${userId}`
        );
        const { error: dbUpdateError } = await supabaseAdmin
          .from("users")
          .update({
            email: value,
            // updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (dbUpdateError) {
          console.error(
            "⚠️ [API] Database email update failed:",
            dbUpdateError
          );
          // Log the error but continue as auth was updated successfully
        } else {
          console.log("✅ [API] Database email updated successfully");
        }

        console.log("✅ [API] Email update successful");
        result = { success: true };
        break;

      case "password":
        console.log("🔐 [API] Updating password");
        // Update password through Supabase Auth
        const { error: passwordError } =
          await supabaseAdmin.auth.admin.updateUserById(dbUser.auth_uid, {
            password: value,
          });

        if (passwordError) {
          console.error("❌ [API] Password update failed:", passwordError);
          return NextResponse.json(
            { error: `Failed to update password: ${passwordError.message}` },
            { status: 500 }
          );
        }

        console.log("✅ [API] Password update successful");
        result = { success: true };
        break;

      case "username":
        console.log("👤 [API] Updating username to:", value);

        // Check if username is already taken
        console.log("🔍 [API] Checking if username is already taken...");
        const { data: existingUser, error: lookupError } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("username", value)
          .neq("id", userId)
          .single();

        if (lookupError) {
          console.log(
            "ℹ️ [API] Username lookup error (likely just means not found):",
            lookupError.message
          );
        }

        if (existingUser) {
          console.error("❌ [API] Username already taken by another user");
          return NextResponse.json(
            { error: "Username already taken" },
            { status: 409 }
          );
        }

        console.log("✅ [API] Username is available, proceeding with update");

        // Update username in custom users table
        const { error: usernameError } = await supabaseAdmin
          .from("users")
          .update({
            username: value,
            // username_changed_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (usernameError) {
          console.error("❌ [API] Username update failed:", usernameError);
          return NextResponse.json(
            { error: `Failed to update username: ${usernameError.message}` },
            { status: 500 }
          );
        }

        console.log("✅ [API] Username updated successfully");
        result = { success: true };
        break;

      default:
        console.error("❌ [API] Invalid field specified:", field);
        return NextResponse.json(
          { error: `Invalid field: ${field}` },
          { status: 400 }
        );
    }

    console.log(`🎉 [API] Successfully updated ${field}`);
    return NextResponse.json(
      { success: true, message: `${field} updated successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("💥 [API] Error updating user profile:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
