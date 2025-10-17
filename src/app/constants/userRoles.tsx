import { Users, Contact } from "lucide-react";
import { ReactNode } from "react";

export interface ResponsibilityItem {
  text: string;
}

export interface ResponsibilityRole {
  key: string;
  title: string;
  shortTitle: string;
  description: string;
  invitationDescription: string;
  icon: ReactNode;
  responsibilities: ResponsibilityItem[];
  footer: string;
}

export const RESPONSIBILITY_ROLES: Record<string, ResponsibilityRole> = {
  representative: {
    key: "representative",
    title: "Authorised Representative",
    shortTitle: "Representative",
    description:
      "When someone designates you as their Authorised Representative",
    invitationDescription:
      "would like you to serve as their Authorised Representative to help manage important documents and decisions.",
    icon: <Users className="h-5 w-5 text-foreground" />,
    responsibilities: [
      {
        text: "Access and manage their will documents",
      },
      {
        text: "Make decisions on their behalf when authorised",
      },
      {
        text: "Ensure their wishes are carried out",
      },
      {
        text: "Keep their information confidential",
      },
    ],
    footer: "Your role is to act in their best interest",
  },
  emergencyContact: {
    key: "emergency-contact",
    title: "Emergency Contact",
    shortTitle: "Emergency Contact",
    description: "When someone designates you as their Emergency Contact",
    invitationDescription:
      "would like you to serve as their Emergency Contact for urgent situations and assistance.",
    icon: <Contact className="h-5 w-5 text-foreground" />,
    responsibilities: [
      {
        text: "Be available for emergency situations",
      },
      {
        text: "Provide assistance when they cannot be reached",
      },
      {
        text: "Help coordinate care or support when needed",
      },
      {
        text: "Maintain up-to-date contact information",
      },
    ],
    footer: "Your prompt response is crucial in emergencies",
  },
};

export const getResponsibilityRole = (
  type: "representative" | "emergency-contact"
): ResponsibilityRole => {
  return type === "representative"
    ? RESPONSIBILITY_ROLES.representative
    : RESPONSIBILITY_ROLES.emergencyContact;
};
