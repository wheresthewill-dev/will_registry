"use client";

import React from "react";
import { useUserAuthorizedRepresentatives } from "@/app/utils/repo_services/hooks/user_authorized_representative";
import ResendInvitationModal from "@/components/custom/modals/ResendInvitationModal";
import { representativeInvitationConfig } from "@/components/custom/modals/modal-config";

interface ResendRepresentativeInvitationProps {
  representativeId: string;
  representativeName: string;
  representativeEmail: string;
  inviteExpires: string;
  onSuccess?: () => void | Promise<void>;
  triggerVariant?: "default" | "outline" | "ghost";
  triggerSize?: "sm" | "default" | "lg";
  triggerText?: string;
  showIcon?: boolean;
  invitationStatus: "pending" | "expired" | "registered";
  triggerId?: string;
  iconOnly?: boolean;
  className?: string;
}

export default function ResendRepresentativeInvitation({
  representativeId,
  representativeName,
  representativeEmail,
  inviteExpires,
  onSuccess,
  triggerVariant = "outline",
  triggerSize = "default",
  triggerText,
  showIcon = true,
  invitationStatus,
  triggerId,
  iconOnly = false,
  className,
}: ResendRepresentativeInvitationProps) {
  const { resendInvitation } = useUserAuthorizedRepresentatives();

  return (
    <ResendInvitationModal
      config={representativeInvitationConfig}
      personId={representativeId}
      personName={representativeName}
      personEmail={representativeEmail}
      inviteExpires={inviteExpires}
      resendFunction={resendInvitation}
      onSuccess={onSuccess}
      triggerVariant={triggerVariant}
      triggerSize={triggerSize}
      triggerText={triggerText}
      showIcon={showIcon}
      invitationStatus={invitationStatus}
      triggerId={triggerId}
      iconOnly={iconOnly}
      className={className}
    />
  );
}
