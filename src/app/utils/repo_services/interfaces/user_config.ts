// UserConfig interface and types

import { ReactNode } from "react";

export interface UserConfig {
  name: ReactNode;
  id: string;
  user_id: number; // or string if your users.id is UUID
  dashboard_enabled: boolean;
  wills_enabled: boolean;
  representatives_enabled: boolean;
  emergency_contacts_enabled: boolean;
  subscription_enabled: boolean;
  profile_enabled: boolean;
  settings_enabled: boolean;
  two_factor_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// For creating a new config (id auto-generated)
export type CreateUserConfig = Omit<UserConfig, 'id'>;

// For updating config (all fields optional except id)
export type UpdateUserConfig = Partial<Omit<UserConfig, 'id'>>;
