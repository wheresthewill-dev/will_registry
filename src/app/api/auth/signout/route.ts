import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: async () => (await cookies()).getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(async ({ name, value, options }) => {
            (await cookies()).set(name, value, options);
          });
        },
      },
    }
  );
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Clear cookies (optional but safe redundancy)
  (await
    // Clear cookies (optional but safe redundancy)
    cookies()).delete('sb-access-token');
  (await cookies()).delete('sb-refresh-token');

  return NextResponse.json({ success: true });
}