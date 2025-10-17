"use client";

import { useSubscriptionLimits } from "@/app/utils/repo_services/hooks/subscription-limits";
import { useUserEmergencyContacts } from "@/app/utils/repo_services/hooks/user_emergency_contact";
import { useUserAuthorizedRepresentatives } from "@/app/utils/repo_services/hooks/user_authorized_representative";
import AlertDialogDestructive from "@/components/alert-dialog-destructive";
import { UserRoundX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { VARIANT_STYLES } from "@/app/constants/ui-variants";
import { cn } from "@/lib/utils";

// Types for configuration
export type PersonType = "contact" | "representative";

export interface DeleteConfig {
  type: PersonType;
  entityName: string; // "Emergency Contact" | "Representative"
  entityLabel: string; // "emergency contact" | "representative"
  usageType: "emergencyContacts" | "representatives";
  accessDescription: string; // What they lose access to
}

export interface DeletePersonModalProps {
  config: DeleteConfig;
  personId: string;
  personName?: string;
  onSuccess?: () => void | Promise<void>;
  size: "default" | "sm" | "lg" | "icon";
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "link"
    | "destructive"
    | "secondary";
  triggerText?: string;
  iconOnly?: boolean;
  className?: string;
}

export default function DeletePersonModal({
  config,
  personId,
  personName = `this ${config.entityLabel}`,
  onSuccess,
  size,
  triggerText,
  variant,
  iconOnly = false,
  className,
}: DeletePersonModalProps) {
  // Router for page refresh
  const router = useRouter();

  // Hooks - conditionally use based on config type
  const { deleteContact } = useUserEmergencyContacts();
  const { deleteRepresentative } = useUserAuthorizedRepresentatives();
  const { decrementUsage } = useSubscriptionLimits();

  // Local state
  const [isDeleting, setIsDeleting] = useState(false);

  // Get the appropriate delete function based on config type
  const getDeleteFunction = () => {
    switch (config.type) {
      case "contact":
        return deleteContact;
      case "representative":
        return deleteRepresentative;
      default:
        throw new Error(`Unsupported person type: ${config.type}`);
    }
  };

  // Enhanced delete handler with comprehensive error handling and user feedback
  const handleDeletePerson = async () => {
    if (!personId) {
      toast.error("Cannot delete person", {
        description: "Missing information. Please try again.",
        duration: 4000,
      });
      return;
    }

    setIsDeleting(true);

    try {
      // Show loading toast with elderly-friendly message
      const loadingToast = toast.loading(`Removing ${config.entityLabel}...`);

      // Get the appropriate delete function
      const deleteFunction = getDeleteFunction();

      // Call the delete API
      const success = await deleteFunction(personId);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (success) {
        // Update usage count
        decrementUsage(config.usageType);

        // Show simple success message
        toast.success(`${config.entityName} removed!`, {
          description: `${personName} has been removed successfully.`,
          duration: 4000,
        });

        // Call onSuccess callback to refresh parent data
        if (onSuccess) {
          await onSuccess();
        }

        // Refresh the page to ensure UI is updated
        router.refresh();
      } else {
        // Handle failed deletion
        toast.error("Could not remove person", {
          description: "Please try again later.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error(`Delete ${config.entityLabel} error:`, error);

      // Show simple error message for elderly users
      toast.error("Something went wrong", {
        description: "Please try again.",
        duration: 4000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Generate confirmation text based on config
  const getConfirmationText = () => {
    if (isDeleting) {
      return `Removing...`;
    }
    return triggerText || `Remove ${config.entityName}`;
  };

  // Generate description based on config
  const getDescription = () => {
    return (
      <>
        Are you sure you want to remove{" "}
        <span className="font-bold">"{personName}"</span>?
        <br />
        {config.accessDescription}
      </>
    );
  };

  return (
    <AlertDialogDestructive
      icon={<UserRoundX />}
      title={`Remove ${config.entityName}`}
      description={getDescription()}
      onClick={handleDeletePerson}
      confirmText={getConfirmationText()}
      cancelText="Cancel"
      triggerText={triggerText}
      size={size}
      className={className}
      variant={variant}
      iconOnly={iconOnly}
    />
  );
}
