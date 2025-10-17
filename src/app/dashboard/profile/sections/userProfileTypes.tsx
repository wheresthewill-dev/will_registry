import { LucideIcon } from "lucide-react";

export interface UserAccountDetails {
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  addressLine: string;
  addressCountry: string;
  addressState: string;
  addressTown: string;
  addressPostcode: string;
  homePhone?: string;
  workPhone?: string;
  mobilePhone?: string;
  profileImage?: string;
}

export interface User extends UserAccountDetails {
  id?: string;
  username: string;
  currentPlan: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface LoginActivity {
  device: string;
  location: string;
  ipAddress: string;
  dateTime: string;
}

export interface PaymentHistory {
  date: string;
  amount: string;
  paymentMethod: string;
  status: string;
}

export interface AccountSettingsContextType {
  isLoading: boolean;
  userData: User | null;
  setUserData: (data: Partial<User>) => Promise<boolean>;
  userSubscription: any;
  userAddress: any;
  userContacts: any;
  paymentHistory: PaymentHistory[];
  currentDate: string;
  currentDateTime: string;
  subscriptionEndDate: string | null;
  updateProfileImage: (file: File | null) => Promise<boolean>;
  refreshCurrentUser: () => Promise<boolean>;

  // Methods from original hooks
  updateUserProfile: (data: any) => Promise<boolean>;
  updateUserAddress: (data: any) => Promise<boolean>;
  updateUserContact: (type: string, value: string) => Promise<boolean>;
  getContactByType: (type: string) => any;
  getSubscriptionInfo: () => any;
}
