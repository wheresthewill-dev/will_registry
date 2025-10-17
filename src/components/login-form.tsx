import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "./custom/password-input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { AlertCallout } from "./alerts";
import { USER_LOGIN_DETAILS } from "@/app/constants/form-field-constants";
import { APP_LOGO_ICON } from "@/app/constants/app.config";
import Brand from "./brand";
import Image from "next/image";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  LoginFormValues,
  loginValidationSchema,
} from "@/app/schemas/validation/login-schema";
import { supabase } from "@/app/utils/supabase/client";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginValidationSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  // Handle redirect effect
  useEffect(() => {
    if (isRedirecting) {
      // Add an additional redirect fallback
      const redirectTimeout = setTimeout(() => {
        console.log("Redirect timeout triggered, forcing navigation");
        window.location.href = "/dashboard";
      }, 1000);
      
      return () => clearTimeout(redirectTimeout);
    }
  }, [isRedirecting]);

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    setError("");
    
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      setError(data.error || "An error occurred during login");
      setIsSubmitting(false);
    } else if (data.success) {
      if (data.isAdmin) {
        // Admin users bypass OTP verification
        console.log("Admin user detected, setting session and redirecting to dashboard");
        setIsRedirecting(true);
        
        // Set the session in the client-side Supabase instance if it was returned
        if (data.session) {
          try {
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token
            });
            console.log("Session set successfully, redirecting...");
            
            // Force a hard redirect to dashboard
            window.location.href = "/dashboard";
            
            // As a fallback, also try router navigation after a delay
            setTimeout(() => {
              if (window.location.pathname !== "/dashboard") {
                console.log("Fallback redirect with router.push");
                router.push("/dashboard");
              }
            }, 500);
          } catch (error) {
            console.error("Error setting session:", error);
            setError("Error setting session. Please try again.");
            setIsSubmitting(false);
            setIsRedirecting(false);
          }
        } else {
          console.error("No session data returned, forcing redirect");
          window.location.href = "/dashboard";
        }
      } else if (data.redirectTo) {
        // Regular users go to OTP verification
        console.log(`Redirecting to: ${data.redirectTo}`);
        window.location.href = data.redirectTo;
      } else {
        console.log("No redirect URL specified, defaulting to dashboard");
        window.location.href = "/dashboard";
      }
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-sm lg:max-w-lg w-full">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Form {...form}>
            <CardHeader className="flex flex-col items-start">
              <div className="flex flex-col items-start mb-6 gap-4">
                <Image src={APP_LOGO_ICON} alt="logo" width={65} height={65} />
                <Brand className="!text-lg" />
              </div>
              <CardTitle>Welcome back!</CardTitle>
              <CardDescription>Please enter your login details</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <AlertCallout
                  variant={"error"}
                  message={error}
                  className="mb-4"
                ></AlertCallout>
              )}
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-6"
              >
                {USER_LOGIN_DETAILS.map((field) => (
                  <FormField
                    control={form.control}
                    name={field.name as "email" | "password"}
                    key={field.name}
                    render={({ field: f }) => (
                      <FormItem className="flex flex-col items-start">
                        <div className="flex items-center justify-between w-full">
                          <FormLabel
                            htmlFor={field.name}
                            className="text-xs md:text-sm"
                          >
                            {field.label}
                          </FormLabel>
                        </div>
                        <FormControl>
                          {field.type === "password" ? (
                            <PasswordInput
                              id={field.name}
                              value={f.value as string}
                              onChange={(e) => f.onChange(e.target.value)}
                              placeholder={`Enter your ${field.label.toLowerCase()}`}
                            />
                          ) : (
                            <Input
                              type={field.type || "text"}
                              id={field.name}
                              {...f}
                              value={f.value}
                              placeholder={`Enter your ${field.label.toLowerCase()}`}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  ></FormField>
                ))}

                <div className="flex flex-col gap-6 items-center">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || isRedirecting}
                  >
                    {isRedirecting ? (
                      <>
                        <Loader2Icon className="animate-spin" /> Redirecting to dashboard...
                      </>
                    ) : isSubmitting ? (
                      <>
                        <Loader2Icon className="animate-spin" /> Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                  <div>
                    <ForgotPasswordLink />
                  </div>
                </div>

                <div className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <a href="/register" className="underline underline-offset-4">
                    Sign up
                  </a>
                </div>
              </form>
            </CardContent>
          </Form>
        </div>
      </div>
    </div>
  );
}

// TODO: add forgot password link functionality
function ForgotPasswordLink() {
  return (
    <a
      href="#"
      className="ml-auto text-sm underline-offset-4 underline hover:text-foreground text-center text-muted-foreground"
    >
      Forgot your password?
    </a>
  );
}
