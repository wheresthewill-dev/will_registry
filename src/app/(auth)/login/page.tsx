"use client";
import { LOGIN_PAGE_IMAGE_PATH } from "@/app/constants/image-paths";
import { LoginForm } from "@/components/login-form";
import PageTransition from "@/components/page-transition";
import Image from "next/image";

export default function LoginPage() {
  return (
    <PageTransition>
      <div className="grid min-h-screen grid-cols-1 py-10 lg:grid-cols-2 lg:py-0">
        <LoginForm />
        <div className="relative hidden h-full lg:block">
          <Image
            src={LOGIN_PAGE_IMAGE_PATH}
            alt="login-image"
            fill
            priority
            className="object-cover"
          />
        </div>
      </div>
    </PageTransition>
  );
}
