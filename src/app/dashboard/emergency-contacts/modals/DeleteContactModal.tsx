"use client";

import DeletePersonModal from "@/components/custom/modals/DeletePersonModal";
import { emergencyContactDeleteConfig } from "@/components/custom/modals/modal-config";
import React from "react";

interface DeleteEmergencyContactModalProps {
  contactId: string;
  contactName?: string;
  onSuccess?: () => void | Promise<void>;
  triggerText?: string;
  iconOnly?: boolean;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "link"
    | "destructive"
    | "secondary";
  className?: string;
}

export default function DeleteEmergencyContactModal({
  contactId,
  contactName = "this contact",
  onSuccess,
  triggerText,
  iconOnly = false,
  variant,
  className,
}: DeleteEmergencyContactModalProps) {
  return (
    <DeletePersonModal
      config={emergencyContactDeleteConfig}
      personId={contactId}
      personName={contactName}
      onSuccess={onSuccess}
      triggerText={triggerText}
      size={iconOnly ? "sm" : "default"}
      iconOnly={iconOnly}
      variant={variant}
      className={className}
    />
  );
}
