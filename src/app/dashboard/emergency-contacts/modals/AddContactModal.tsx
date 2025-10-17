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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { Plus, Crown } from "lucide-react";
import { useUserEmergencyContacts } from "@/app/utils/repo_services/hooks/user_emergency_contact";
import { useSubscriptionLimits } from "@/app/utils/repo_services/hooks/subscription-limits";
import { UpgradePromptDialog } from "@/components/upgrade-prompt";
import { LoadingIndicator } from "@/components/custom/LoadingIndicator";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/app/constants/routes";

// Zod schema for emergency contact validation
const addEmergencyContactSchema = z
  .object({
    contactFirstName: z.string().min(1, "First name is required"),
    contactLastName: z.string().min(1, "Last name is required"),
    contactEmail: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    contactNumber: z
      .string()
      .min(1, "Phone number is required")
      .min(10, "Phone number must be at least 10 digits"),
    relationship: z.string().min(1, "Relationship is required"),
    customRelationship: z.string().optional(),
  })
  .refine(
    (data) => {
      // If relationship is "other", customRelationship must be provided
      if (data.relationship === "other") {
        return (
          data.customRelationship && data.customRelationship.trim().length > 0
        );
      }
      return true;
    },
    {
      message: "Please specify the relationship",
      path: ["customRelationship"],
    }
  );

type AddEmergencyContactForm = z.infer<typeof addEmergencyContactSchema>;

interface AddContactModalProps {
  triggerVariant?: "default" | "outline" | "ghost";
  triggerSize?: "sm" | "default" | "lg";
  triggerText?: string;
  showIcon?: boolean;
}

export default function AddContactModal({
  triggerVariant = "default",
  triggerSize = "default",
  triggerText,
  showIcon = true,
}: AddContactModalProps) {
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const { createEmergencyContact } = useUserEmergencyContacts();
  const { canAddEmergencyContact, getUpgradePrompt, incrementUsage, userTier } =
    useSubscriptionLimits();

  // Form setup
  const form = useForm<AddEmergencyContactForm>({
    resolver: zodResolver(addEmergencyContactSchema),
    defaultValues: {
      contactFirstName: "",
      contactLastName: "",
      contactEmail: "",
      contactNumber: "",
      relationship: "",
      customRelationship: "",
    },
  });

  // Check subscription limits
  const limitCheck = canAddEmergencyContact();

  const router = useRouter();

  // Relationship options
  const relationshipOptions = [
    { value: "spouse", label: "Spouse" },
    { value: "parent", label: "Parent" },
    { value: "child", label: "Child" },
    { value: "sibling", label: "Sibling" },
    { value: "friend", label: "Friend" },
    { value: "lawyer", label: "Lawyer" },
    { value: "doctor", label: "Doctor" },
    { value: "other", label: "Other" },
  ];

  // Handle trigger button click
  const handleTriggerClick = () => {
    if (!limitCheck.allowed) {
      setShowUpgradePrompt(true);
    } else {
      setIsDialogOpen(true);
    }
  };

  // Handle form submission
  const onSubmit = async (values: AddEmergencyContactForm) => {
    setIsSubmitting(true);

    try {
      // Determine final relationship value
      const finalRelationship =
        values.relationship === "other"
          ? values.customRelationship
          : values.relationship;

      // Create the contact
      const result = await createEmergencyContact({
        ...values,
        relationship: finalRelationship!,
      });

      if (result.success) {
        // Update usage count
        incrementUsage("emergencyContacts");

        // Close modal and reset form
        setIsDialogOpen(false);
        form.reset();

        // Refresh the page to allow rerender of updated data
        router.refresh();

        // Navigate to emergency contacts page to ensure we're on the right page
        router.push(ROUTES.emergencyContacts);

        // Optional: Show success message
        console.log("Emergency contact added successfully");
      } else {
        // Handle error - you might want to show this in a toast or form error
        form.setError("root", {
          message: result.error || "Failed to create emergency contact",
        });
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      form.setError("root", {
        message: "An unexpected error occurred. Please try again.",
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

  // Watch relationship field to show/hide custom relationship input
  const watchedRelationship = form.watch("relationship");

  // Determine trigger button text and icon
  const buttonText =
    triggerText || (limitCheck.allowed ? "Add Contact" : "Upgrade to Add More");
  const ButtonIcon = limitCheck.allowed ? Plus : Crown;

  return (
    <>
      <Button
        onClick={handleTriggerClick}
        variant={limitCheck.allowed ? triggerVariant : "default"}
        size={triggerSize}
      >
        {showIcon && <ButtonIcon className="w-4 h-4 mr-2" />}
        {buttonText}
      </Button>

      {/* Add Contact Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
            <DialogDescription>
              Add someone who can be contacted in case of emergency. They will
              receive an invitation to access your emergency information.
            </DialogDescription>

            {/* Show current usage info for all tiers */}
            {limitCheck.limit !== -1 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
                <p className="text-gray-700 text-sm">
                  <span className="font-medium">
                    {limitCheck.limit - limitCheck.remaining} of{" "}
                    {limitCheck.limit}
                  </span>{" "}
                  emergency contacts used on your{" "}
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
                  name="contactFirstName"
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
                  name="contactLastName"
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

              {/* Email Field */}
              <FormField
                control={form.control}
                name="contactEmail"
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

              {/* Phone Field */}
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <PhoneInput
                        placeholder="Enter phone number"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Relationship Field */}
              <FormField
                control={form.control}
                name="relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship to You</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationshipOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Choose the option that best describes your relationship
                      with this contact
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom Relationship Field - Only show when "other" is selected */}
              {watchedRelationship === "other" && (
                <FormField
                  control={form.control}
                  name="customRelationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specify Relationship</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter relationship type"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                    "Add Contact"
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
        prompt={getUpgradePrompt("emergencyContacts")}
        onUpgrade={handleUpgrade}
      />
    </>
  );
}
