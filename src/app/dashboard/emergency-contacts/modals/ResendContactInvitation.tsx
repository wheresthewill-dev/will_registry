"use client";

import React from "react";
import { useUserEmergencyContacts } from "@/app/utils/repo_services/hooks/user_emergency_contact";
import { emergencyContactInvitationConfig } from "@/components/custom/modals/modal-config";
import ResendInvitationModal from "@/components/custom/modals/ResendInvitationModal";

interface ResendEmergencyContactInvitationProps {
  contactId: string;
  contactName: string;
  contactEmail: string;
  contactRelationship?: string;
  inviteExpires: string;
  onSuccess?: () => void | Promise<void>;
  triggerVariant?: "default" | "outline" | "ghost";
  triggerSize?: "sm" | "default" | "lg";
  triggerText?: string;
  showIcon?: boolean;
  invitationStatus: "pending" | "expired" | "active" | "registered";
  triggerId?: string;
  iconOnly?: boolean;
}

export default function ResendEmergencyContactInvitation({
  contactId,
  contactName,
  contactEmail,
  contactRelationship,
  inviteExpires,
  onSuccess,
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerText,
  showIcon = true,
  invitationStatus,
  triggerId,
  iconOnly = false,
}: ResendEmergencyContactInvitationProps) {
  const { resendInvitation } = useUserEmergencyContacts();

  return (
    <ResendInvitationModal
      config={emergencyContactInvitationConfig}
      personId={contactId}
      personName={contactName}
      personEmail={contactEmail}
      personRelationship={contactRelationship}
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
    />
  );
}
