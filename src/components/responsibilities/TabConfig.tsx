import { BellRing, CheckCircle2, Users, Contact } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface TabConfig {
  value: string;
  label: string;
  icon: LucideIcon;
  emptyTitle: string;
}

export const TABS_CONFIG: TabConfig[] = [
  {
    value: "pending",
    label: "Pending Invitations",
    icon: BellRing,
    emptyTitle: "No pending requests",
  },
  {
    value: "active",
    label: "Active Responsibilities",
    icon: CheckCircle2,
    emptyTitle: "No active responsibilities",
  },
  {
    value: "representatives",
    label: "Representatives",
    icon: Users,
    emptyTitle: "No representative responsibilities",
  },
  {
    value: "emergency-contacts",
    label: "Emergency Contacts",
    icon: Contact,
    emptyTitle: "No emergency contact responsibilities",
  },
];

export default TABS_CONFIG;
