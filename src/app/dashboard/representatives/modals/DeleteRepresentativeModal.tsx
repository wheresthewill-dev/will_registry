"use client";

import DeletePersonModal from "@/components/custom/modals/DeletePersonModal";
import { representativeDeleteConfig } from "@/components/custom/modals/modal-config";
import React from "react";

interface DeleteRepresentativeModalProps {
  representativeId: string;
  representativeName?: string;
  onSuccess?: () => void | Promise<void>;
  triggerText?: string;
  triggerId?: string;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "link"
    | "destructive"
    | "secondary";
  iconOnly?: boolean;
  className?: string;
}

export default function DeleteRepresentativeModal({
  representativeId,
  representativeName = "this representative",
  onSuccess,
  triggerText,
  variant,
  iconOnly = false,
  className,
}: DeleteRepresentativeModalProps) {
  return (
    <DeletePersonModal
      config={representativeDeleteConfig}
      personId={representativeId}
      personName={representativeName}
      onSuccess={onSuccess}
      triggerText={triggerText}
      size={"default"}
      variant={variant}
      iconOnly={iconOnly}
      className={className}
    />
  );
}
