"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Info, AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import { useAccountSettingsContext } from "@/contexts/AccountSettingsContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogClose } from "@radix-ui/react-dialog";
import { VARIANT_STYLES } from "@/app/constants/ui-variants";
import { PasswordInput } from "@/components/custom/password-input";
import { useProfileUpdate } from "@/hooks/useProfileUpdate";
import { toast } from "sonner";

// Cooldown period in days
const EMAIL_CHANGE_COOLDOWN_DAYS = 30;
const USERNAME_CHANGE_COOLDOWN_DAYS = 90;

// Schema for password change
const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Please enter your current password."),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters.")
      .regex(/[A-Z]/, "Include at least one capital letter (A-Z).")
      .regex(
        /[@$!%*?&#]/,
        "Include at least one special character (e.g., @, #, &)."
      ),
    confirmPassword: z.string().min(6, "Please confirm your password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Schema for email change
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Please enter your current password"),
});

// Schema for username change
const usernameSchema = z.object({
  username: z
    .string()
    .nonempty("Please enter a username.")
    .min(6, "Username must be at least 6 characters long.")
    .max(20, "Username must not exceed 20 characters.")
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      "Username must start with a letter and can only contain letters, numbers, and underscores."
    ),
  password: z.string().min(1, "Please enter your current password"),
});

export default function AccountDetailsSection() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [emailChangeStatus, setEmailChangeStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [usernameChangeStatus, setUsernameChangeStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);

  const { userData, currentDate, currentDateTime } =
    useAccountSettingsContext();

  // Initialize the profile update hook
  const {
    isUpdating,
    error: updateError,
    updateEmail,
    updateUsername,
    updatePassword,
  } = useProfileUpdate({
    userId: userData?.id, // Pass user ID from userData
    onSuccess: (field) => {
      if (field === "email") setEmailChangeStatus("success");
      if (field === "username") setUsernameChangeStatus("success");
      if (field === "password") setPasswordChangeStatus("success");
      // Toast is handled in the individual submit functions
    },
    onError: (field, error) => {
      if (field === "email") setEmailChangeStatus("error");
      if (field === "username") setUsernameChangeStatus("error");
      if (field === "password") setPasswordChangeStatus("error");
      // Toast is handled in the individual submit functions
    },
  });

  // change into currentDateTime after testing
  const CURRENT_DATE_TIME = "2025-08-29 15:21:33";

  // Mock data for last changes (would come from the backend)
  const [lastEmailChange, setLastEmailChange] = useState<string>(
    "2025-07-15 09:45:22"
  );
  const [lastUsernameChange, setLastUsernameChange] = useState<string>(
    "2025-02-20 14:30:11"
  );

  // Calculate days since last change
  const daysSinceEmailChange = Math.floor(
    (new Date(CURRENT_DATE_TIME).getTime() -
      new Date(lastEmailChange).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const daysSinceUsernameChange = Math.floor(
    (new Date(CURRENT_DATE_TIME).getTime() -
      new Date(lastUsernameChange).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Check if within cooldown period
  const emailChangeCooldownActive =
    daysSinceEmailChange < EMAIL_CHANGE_COOLDOWN_DAYS;
  const usernameChangeCooldownActive =
    daysSinceUsernameChange < USERNAME_CHANGE_COOLDOWN_DAYS;

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: userData?.email || "",
      password: "",
    },
  });

  const usernameForm = useForm<z.infer<typeof usernameSchema>>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: userData?.username || "",
      password: "",
    },
  });

  useEffect(() => {
    // Reset forms when user data changes
    if (userData) {
      emailForm.reset({ email: userData.email || "", password: "" });
      usernameForm.reset({ username: userData.username || "", password: "" });
    }
  }, [userData, emailForm, usernameForm]);

  // Reset status messages after 5 seconds
  useEffect(() => {
    if (passwordChangeStatus !== "idle") {
      const timer = setTimeout(() => {
        setPasswordChangeStatus("idle");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [passwordChangeStatus]);

  // Handle password change submission
  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    console.log("🖱️ [UI] User submitted password change form", {
      hasCurrentPassword: !!data.currentPassword,
      hasNewPassword: !!data.newPassword,
      hasConfirmPassword: !!data.confirmPassword,
      passwordsMatch: data.newPassword === data.confirmPassword,
    });
    setIsChangingPassword(true);
    try {
      // Validate passwords match
      if (data.newPassword !== data.confirmPassword) {
        console.error(
          "❌ [UI] Password validation failed: passwords do not match"
        );
        // Form validation will handle this error
        setPasswordChangeStatus("error");
        return;
      }

      // Call our API endpoint via the hook
      console.log("🔄 [UI] Calling updatePassword hook");
      const success = await updatePassword(
        data.newPassword,
        data.currentPassword
      );
      console.log("📣 [UI] Password update response:", success);

      if (success) {
        console.log("✅ [UI] Password update successful");
        setPasswordChangeStatus("success");
        passwordForm.reset({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        // Success is now handled by the Alert component
      } else {
        console.error("❌ [UI] Password update returned false");
        setPasswordChangeStatus("error");
        // Only reset current password on failure, keep the new password fields
        passwordForm.setValue("currentPassword", "");
      }
    } catch (error) {
      console.error("💥 [UI] Exception during password update:", error);
      setPasswordChangeStatus("error");

      // Only reset current password on failure
      passwordForm.setValue("currentPassword", "");

      // Error is now handled by the Alert component
    } finally {
      setIsChangingPassword(false);
      console.log("🏁 [UI] Password update operation completed");
    }
  };

  // Handle email change submission
  const onEmailSubmit = async (data: z.infer<typeof emailSchema>) => {
    console.log("🖱️ [UI] User submitted email change form:", {
      newEmail: data.email,
      hasPassword: !!data.password,
    });
    setEmailChangeStatus("pending");
    try {
      // Call our API endpoint via the hook
      console.log("🔄 [UI] Calling updateEmail hook with:", data.email);
      const success = await updateEmail(data.email, data.password);
      console.log("📣 [UI] Email update response:", success);

      if (success) {
        console.log("✅ [UI] Email update successful");
        setEmailChangeStatus("success");
        setLastEmailChange(CURRENT_DATE_TIME);

        // Reset form and close dialog after success (with delay for user to see success message)
        setTimeout(() => {
          emailForm.reset({ email: data.email, password: "" });
          setEmailDialogOpen(false);
        }, 3000);

        // Success is now handled by the Alert component in the modal
      } else {
        console.error("❌ [UI] Email update returned false");
        throw new Error("Failed to update email");
      }
    } catch (error) {
      console.error("💥 [UI] Exception during email update:", error);
      setEmailChangeStatus("error");

      // Reset password field on error
      emailForm.setValue("password", "");

      // Error is now handled by the Alert component in the modal
    }
  };

  // Handle username change submission
  const onUsernameSubmit = async (data: z.infer<typeof usernameSchema>) => {
    console.log("🖱️ [UI] User submitted username change form:", {
      newUsername: data.username,
      hasPassword: !!data.password,
    });
    setUsernameChangeStatus("pending");
    try {
      // Call our API endpoint via the hook
      console.log("🔄 [UI] Calling updateUsername hook with:", data.username);
      const success = await updateUsername(data.username, data.password);
      console.log("📣 [UI] Username update response:", success);

      if (success) {
        console.log("✅ [UI] Username update successful");
        setUsernameChangeStatus("success");
        setLastUsernameChange(CURRENT_DATE_TIME);

        // Reset form and close dialog after success (with delay for user to see success message)
        setTimeout(() => {
          usernameForm.reset({ username: data.username, password: "" });
          setUsernameDialogOpen(false);
        }, 3000);

        // Success is now handled by the Alert component in the modal
      } else {
        console.error("❌ [UI] Username update returned false");
        throw new Error("Failed to update username");
      }
    } catch (error) {
      console.error("💥 [UI] Exception during username update:", error);
      setUsernameChangeStatus("error");

      // Reset password field on error
      usernameForm.setValue("password", "");

      // Error is now handled by the Alert component in the modal
    }
  };

  if (!userData) {
    return <div className="space-y-6">Loading account details...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>
            Your account details information is used for login and
            communication. Changes to these details require additional
            verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Information */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                Email Address
              </div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{userData.email}</p>
                {userData.email && (
                  <Badge variant="outline" className={VARIANT_STYLES.SUCCESS}>
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Last changed: {lastEmailChange}
                    {emailChangeCooldownActive && (
                      <span className="inline-flex items-center mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {EMAIL_CHANGE_COOLDOWN_DAYS - daysSinceEmailChange} days
                        until next change
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            {ChangeEmailModal()}
          </div>

          <Separator />

          {/* Username Information */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 md:space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                Username
              </div>
              <div className="font-medium">@{userData.username}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Last changed: {lastUsernameChange}
                    {usernameChangeCooldownActive && (
                      <span className="inline-flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {USERNAME_CHANGE_COOLDOWN_DAYS -
                          daysSinceUsernameChange}{" "}
                        days until next change
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            {ChangeUsernameModal()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Update your password to maintain account security. We recommend
            using a strong, unique password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passwordChangeStatus === "success" && (
            <Alert variant="success" className="mb-4">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Password Updated</AlertTitle>
              <AlertDescription variant="success">
                Your password has been changed successfully. Your account is now
                secured with your new password.
              </AlertDescription>
            </Alert>
          )}

          {passwordChangeStatus === "error" && (
            <Alert className="mb-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                We couldn't update your password. Please check that your current
                password is entered correctly and that your new password meets
                all requirements.
              </AlertDescription>
            </Alert>
          )}

          {isChangingPassword && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Updating Password</AlertTitle>
              <AlertDescription>
                We're processing your password change. Please wait...
              </AlertDescription>
            </Alert>
          )}

          {!isChangingPassword && passwordChangeStatus !== "success" && (
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <PasswordInput {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter your current password.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <PasswordInput {...field} />
                      </FormControl>
                      <FormDescription>
                        Use 6+ characters, with at least one capital letter and
                        one symbol (e.g., @, #, &).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <PasswordInput {...field} />
                      </FormControl>
                      <FormDescription>
                        Re-enter your password to make sure it matches.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>
                      <span className="mr-2">
                        <span
                          className="animate-spin inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                          aria-hidden="true"
                        ></span>
                      </span>
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );

  function ChangeEmailModal() {
    const handleDialogOpenChange = (open: boolean) => {
      setEmailDialogOpen(open);
      if (!open) {
        // Reset form when dialog closes
        emailForm.reset({
          email: userData?.email || "",
          password: "",
        });
        // Reset status after a short delay to allow animations to complete
        setTimeout(() => {
          setEmailChangeStatus("idle");
        }, 300);
      }
    };

    return (
      <Dialog open={emailDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={emailChangeCooldownActive}>
            {emailChangeCooldownActive ? "Change Unavailable" : "Change Email"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              This will send a verification link to your new email address.
              You'll need to verify the new email before the change takes
              effect.
            </DialogDescription>
          </DialogHeader>

          {emailChangeStatus === "pending" && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Verification required</AlertTitle>
              <AlertDescription>
                Please check your new email address for a verification link.
              </AlertDescription>
            </Alert>
          )}

          {emailChangeStatus === "success" && (
            <Alert variant="success">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Verification email sent</AlertTitle>
              <AlertDescription variant="success">
                A verification link has been sent to your new email address.
                Please check your inbox and follow the instructions to complete
                the email change.
              </AlertDescription>
            </Alert>
          )}

          {emailChangeStatus === "error" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription variant="destructive">
                {updateError?.includes("already associated") ||
                updateError?.includes("already in use") ? (
                  <>
                    This email address is already associated with another
                    account. Please use a different email address.
                  </>
                ) : (
                  <>
                    We couldn't update your email address. Please ensure your
                    current password is correct and try again. If the problem
                    persists, contact support.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {emailChangeStatus === "idle" && (
            <Form {...emailForm}>
              <form
                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your-new-email@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription variant="warning">
                    You can only change your email once every{" "}
                    {EMAIL_CHANGE_COOLDOWN_DAYS} days. This helps protect your
                    account security.
                  </AlertDescription>
                </Alert>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className="mr-auto"
                      disabled={isUpdating === "email"}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isUpdating === "email"}>
                    {isUpdating === "email" ? (
                      <>
                        <span className="mr-2">
                          <span
                            className="animate-spin inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                            aria-hidden="true"
                          ></span>
                        </span>
                        Processing...
                      </>
                    ) : (
                      "Change Email"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    );
  }
  function ChangeUsernameModal() {
    const handleDialogOpenChange = (open: boolean) => {
      setUsernameDialogOpen(open);
      if (!open) {
        // Reset form when dialog closes
        usernameForm.reset({
          username: userData?.username || "",
          password: "",
        });
        // Reset status after a short delay to allow animations to complete
        setTimeout(() => {
          setUsernameChangeStatus("idle");
        }, 300);
      }
    };

    return (
      <Dialog open={usernameDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={usernameChangeCooldownActive}>
            {usernameChangeCooldownActive
              ? "Change Unavailable"
              : "Change Username"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Username</DialogTitle>
            <DialogDescription>
              Your username is used for login and mentions. Choose a username
              that's easy to remember.
            </DialogDescription>
          </DialogHeader>

          {usernameChangeStatus === "success" && (
            <Alert variant="success">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Username updated</AlertTitle>
              <AlertDescription variant="success">
                Your username has been changed successfully.
              </AlertDescription>
            </Alert>
          )}

          {usernameChangeStatus === "error" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription variant="destructive">
                We couldn't update your username. Please ensure your current
                password is correct and that the username meets all
                requirements. The username may also be taken by another user.
              </AlertDescription>
            </Alert>
          )}

          {usernameChangeStatus === "pending" && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Updating username</AlertTitle>
              <AlertDescription>
                We're processing your username change. Please wait...
              </AlertDescription>
            </Alert>
          )}

          {usernameChangeStatus === "idle" && (
            <Form {...usernameForm}>
              <form
                onSubmit={usernameForm.handleSubmit(onUsernameSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={usernameForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Username</FormLabel>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-muted-foreground">
                          @
                        </span>
                        <Input className="pl-7" {...field} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Only lowercase letters, numbers, and underscores.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={usernameForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription variant="warning">
                    You can only change your username once every{" "}
                    {USERNAME_CHANGE_COOLDOWN_DAYS} days. Links to your old
                    username will no longer work.
                  </AlertDescription>
                </Alert>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className="mr-auto"
                      disabled={isUpdating === "username"}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isUpdating === "username"}>
                    {isUpdating === "username" ? (
                      <>
                        <span className="mr-2">
                          <span
                            className="animate-spin inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                            aria-hidden="true"
                          ></span>
                        </span>
                        Updating...
                      </>
                    ) : (
                      "Change Username"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    );
  }
}
