import React from "react";
import { RESPONSIBILITY_ROLES } from "@/app/constants/userRoles";
interface ResponsibilityInfoData {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: { text: string }[];
  footer: string;
}

interface ResponsibilityInfoMap {
  representative: ResponsibilityInfoData;
  emergencyContact: ResponsibilityInfoData;
}

const getResponsibilityInfo = (): ResponsibilityInfoMap => {
  return {
    representative: {
      title: `As an ${RESPONSIBILITY_ROLES.representative.title}`,
      description: RESPONSIBILITY_ROLES.representative.description,
      icon: RESPONSIBILITY_ROLES.representative.icon,
      items: RESPONSIBILITY_ROLES.representative.responsibilities,
      footer: RESPONSIBILITY_ROLES.representative.footer,
    },
    emergencyContact: {
      title: `As an ${RESPONSIBILITY_ROLES.emergencyContact.title}`,
      description: RESPONSIBILITY_ROLES.emergencyContact.description,
      icon: RESPONSIBILITY_ROLES.emergencyContact.icon,
      items: RESPONSIBILITY_ROLES.emergencyContact.responsibilities,
      footer: RESPONSIBILITY_ROLES.emergencyContact.footer,
    },
  };
};

export default getResponsibilityInfo;
