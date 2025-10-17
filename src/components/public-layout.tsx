"use client";

import Navbar from "@/components/navbar";
import PageTransition from "@/components/page-transition";
import Footer from "./landing/Footer";
import { useUserSession } from "@/app/utils/repo_services/hooks/useUserSession";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const { user, userLoading: loading } = useUserSession();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 shadow z-50">
        <Navbar user={user} />
      </header>
      <main>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}
