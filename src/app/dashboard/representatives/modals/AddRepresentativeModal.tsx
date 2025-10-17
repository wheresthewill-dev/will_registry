"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Crown, UserRoundPlus } from "lucide-react";
import { useUserAuthorizedRepresentatives } from "@/app/utils/repo_services/hooks/user_authorized_representative";
import { useSubscriptionLimits } from "@/app/utils/repo_services/hooks/subscription-limits";
import { UpgradePromptDialog } from "@/components/upgrade-prompt";
import { LoadingIndicator } from "@/components/custom/LoadingIndicator";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/app/constants/routes";
import { toast } from "sonner";

// Zod schema for representative validation
const addRepresentativeSchema = z.object({
  representativeFirstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters"),
  representativeLastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters"),
  representativeMiddleName: z.string().optional(),
  representativeEmail: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type AddRepresentativeForm = z.infer<typeof addRepresentativeSchema>;

interface AddRepresentativeModalProps {
  triggerVariant?: "default" | "outline" | "ghost";
  triggerSize?: "sm" | "default" | "lg";
  triggerText?: string;
  showIcon?: boolean;
}

export default function AddRepresentativeModal({
  triggerVariant = "default",
  triggerSize = "default",
  triggerText,
  showIcon = true,
}: AddRepresentativeModalProps) {
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const { createRepresentative } = useUserAuthorizedRepresentatives();
  const { canAddRepresentative, getUpgradePrompt, incrementUsage, userTier } =
    useSubscriptionLimits();

  // Form setup
  const form = useForm<AddRepresentativeForm>({
    resolver: zodResolver(addRepresentativeSchema),
    defaultValues: {
      representativeFirstName: "",
      representativeLastName: "",
      representativeMiddleName: "",
      representativeEmail: "",
    },
  });

  // Check subscription limits
  const limitCheck = canAddRepresentative();

  const router = useRouter();

  // Handle trigger button click
  const handleTriggerClick = () => {
    if (!limitCheck.allowed) {
      setShowUpgradePrompt(true);
    } else {
      setIsDialogOpen(true);
    }
  };

  // Handle form submission
  const onSubmit = async (values: AddRepresentativeForm) => {
    setIsSubmitting(true);

    try {
      // Create the representative
      const result = await createRepresentative({
        representativeEmail: values.representativeEmail,
        representativeFirstName: values.representativeFirstName,
        representativeLastName: values.representativeLastName,
        representativeMiddleName: values.representativeMiddleName || undefined,
      });

      if (result.success) {
        // Update usage count
        incrementUsage("representatives");

        // Show success toast
        toast.success(
          "Representative invited successfully! They will receive an email invitation."
        );

        // Close modal and reset form
        setIsDialogOpen(false);
        form.reset();

        // Refresh the page to allow rerender of updated data
        router.refresh();

        // Navigate to representatives page to ensure we're on the right page
        router.push(ROUTES.representatives);

        // Optional: Show success message
        console.log("Representative added successfully");
      } else {
        // Handle error - show in toast and form error
        const errorMessage = result.error || "Failed to create representative";
        toast.error(errorMessage);
        form.setError("root", {
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error("Error adding representative:", error);
      const errorMessage = "An unexpected error occurred. Please try again.";
      toast.error(errorMessage);
      form.setError("root", {
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    form.reset();
    setIsDialogOpen(false);
  };

  // Handle upgrade prompt close
  const handleUpgradePromptClose = () => {
    setShowUpgradePrompt(false);
  };

  // Handle upgrade action
  const handleUpgrade = () => {
    setShowUpgradePrompt(false);
    // TODO: Navigate to upgrade page
    console.log("Navigate to upgrade page");
  };

  // Determine trigger button text and icon
  const buttonText =
    triggerText ||
    (limitCheck.allowed ? "Add Representative" : "Upgrade to Add More");
  const ButtonIcon = limitCheck.allowed ? UserRoundPlus : Crown;

  return (
    <>
      <Button
        onClick={handleTriggerClick}
        variant={limitCheck.allowed ? triggerVariant : "default"}
        size={triggerSize}
      >
        {showIcon && <ButtonIcon className="mr-2" />}
        {buttonText}
      </Button>

      {/* Add Representative Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Authorised Representative</DialogTitle>
            <DialogDescription>
              Add someone who can access your documents when needed. They will
              receive an invitation to become your authorised representative.
            </DialogDescription>

            {/* Show current usage info for all tiers */}
            {limitCheck.limit !== -1 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">
                    {limitCheck.limit - limitCheck.remaining} of{" "}
                    {limitCheck.limit}
                  </span>{" "}
                  representatives used on your{" "}
                  <span className="font-medium capitalize">{userTier}</span>{" "}
                  plan
                </p>
              </div>
            )}
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="representativeFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter first name"
                          autoComplete="given-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="representativeLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter last name"
                          autoComplete="family-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Middle Name Field */}
              <FormField
                control={form.control}
                name="representativeMiddleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter middle name"
                        autoComplete="additional-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="representativeEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      They will receive an invitation at this email address
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Information Box */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">
                  What happens next?
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• An account will be created for this person</li>
                  <li>• They'll receive an email with login credentials</li>
                  <li>• They must accept the invitation within 7 days</li>
                  <li>
                    • They'll be able to access your documents when needed
                  </li>
                </ul>
              </div>

              {/* Root form error */}
              {form.formState.errors.root && (
                <div className="text-destructive text-sm">
                  {form.formState.errors.root.message}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleModalClose}
                  disabled={isSubmitting}
                  className="mr-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <LoadingIndicator text="Adding..." />
                  ) : (
                    "Add Representative"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Upgrade Prompt Dialog */}
      <UpgradePromptDialog
        isOpen={showUpgradePrompt}
        onClose={handleUpgradePromptClose}
        prompt={getUpgradePrompt("representatives")}
        onUpgrade={handleUpgrade}
      />
    </>
  );
}
