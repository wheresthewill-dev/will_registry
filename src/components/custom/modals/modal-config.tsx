import { DeleteConfig } from "./DeletePersonModal";
import { InvitationConfig } from "./ResendInvitationModal";

export const emergencyContactInvitationConfig: InvitationConfig = {
  type: "contact",
  entityName: "Emergency Contact",
  entityLabel: "emergency contact",
  storagePrefix: "contact",
};

export const representativeInvitationConfig: InvitationConfig = {
  type: "representative",
  entityName: "Representative",
  entityLabel: "representative",
  storagePrefix: "representative",
};

export const emergencyContactDeleteConfig: DeleteConfig = {
  type: "contact",
  entityName: "Emergency Contact",
  entityLabel: "emergency contact",
  usageType: "emergencyContacts",
  accessDescription:
    "They will no longer have access to your emergency information.",
};

export const representativeDeleteConfig: DeleteConfig = {
  type: "representative",
  entityName: "Representative",
  entityLabel: "representative",
  usageType: "representatives",
  accessDescription: "They will no longer have access to your will documents.",
};
