"use client";

import { AUTH_BUTTON_LABEL } from "@/app/constants/labels";
import { Button } from "./ui/button";
import { useUserSession } from "@/app/utils/repo_services/hooks/useUserSession";
import router from "next/router";

export default function SignOutButton() {
  const { signOut } = useUserSession();

  const handleLogOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error using auth provider signout:", error);

      // Fallback to the old method if needed
      try {
        await fetch("/api/auth/signout", {
          method: "POST",
        });
        window.location.href = "/";
      } catch (fetchError) {
        console.error("Error with fallback signout:", fetchError);
      }
    }
  };

  return (
    <>
      <Button onClick={handleLogOut} variant="outline">
        {AUTH_BUTTON_LABEL.logout}
      </Button>
    </>
  );
}
