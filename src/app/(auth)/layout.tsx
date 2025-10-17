"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import Brand from "@/components/brand";
import { usePathname } from "next/navigation";
import PageTransition from "@/components/page-transition";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname(); // Get the current route
  const isLoginPage = pathname === "/login";

  return (
    <PageTransition>
      <div className="flex flex-col">
        {!isLoginPage && (
          <div className="flex items-center px-6 py-4 justify-center md:justify-start">
            <Brand />
            <div className={cn("hidden md:block ml-auto font-medium text-sm")}>
              Already have an account?
              <a href="/login" className="underline underline-offset-4 ml-1">
                Login
              </a>
            </div>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full">{children}</div>
        </div>
      </div>
    </PageTransition>
  );
}
