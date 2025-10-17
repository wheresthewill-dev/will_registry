"use client";

import { useUserSession } from "@/app/utils/repo_services/hooks/useUserSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean; // Add optional prop to specify if auth is required
  publicAccessible?: boolean; // Optional prop to specify if the route is publicly accessible
}

export default function ProtectedRoute({ 
  children, 
  fallback,
  requireAuth = true, // Default to requiring authentication
  publicAccessible = false // Default to not publicly accessible
}: ProtectedRouteProps) {
  const { user, userLoading: loading, refreshUser } = useUserSession();
  const router = useRouter();

  useEffect(() => {
    // Only redirect when loading is complete and we still don't have a user
    if (requireAuth && !publicAccessible && !loading && !user) {
      console.log("ProtectedRoute: No user after loading complete, redirecting to login");
      router.push("/login");
    }
  }, [user, loading, router, requireAuth, publicAccessible]);

  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="space-y-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )
    ); 
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
