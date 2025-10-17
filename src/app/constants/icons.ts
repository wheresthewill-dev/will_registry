import {
  CircleHelp,
  CircleUserRound,
  ContactRound,
  FilePenIcon,
  LayoutDashboard,
  Settings2,
  Users,
  CreditCard,
  UserCheck,
  BarChart3,
  UsersRound,
  MessageSquareText,
  ClipboardList,
  Palette,
  Coins,
  LogOut,
} from "lucide-react";

export const ICON_SIZES = {
  xs: "w-2 h-2",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

export const ICON_STROKES = {
  sm: "stroke-1",
  md: "stroke-2",
  lg: "stroke-3",
  xl: "stroke-4",
};

export const SIDEBAR_ICONS = {
  // User icons
  dashboard: LayoutDashboard,
  wills: FilePenIcon,
  representatives: Users,
  emergencyContacts: ContactRound,
  responsibilities: UserCheck,
  subscription: CreditCard,
  settings: Settings2,
  profile: CircleUserRound,
  help: CircleHelp,
  logout: LogOut,

  // Admin icons
  users: UsersRound,
  pageSettings: Palette,
  finances: Coins,
  analytics: BarChart3,
  supportRequests: MessageSquareText,
  subscriptionManagement: CreditCard,
  activityLogs: ClipboardList,
};
