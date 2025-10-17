"use client";

import React from "react";

interface PageLoadingWrapperProps {
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
}

export function PageLoadingWrapper({ 
  children, 
  loading = false, 
  error = null 
}: PageLoadingWrapperProps) {
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️</div>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
