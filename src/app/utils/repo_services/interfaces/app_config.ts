/**
 * Interface for the app_config table in Supabase
 * Contains global application configuration settings
 */

export interface AppConfig {
  id: number;
  business_address: string | null;
  business_contact: string | null;
  customer_support_email: string | null;
  paypal_enabled: boolean | null;
  paypal_key: string | null;
  paypal_secret: string | null;
  // Add future config fields here as they are added to the database
}

export interface AppConfigResponse {
  success: boolean;
  error?: string;
  data?: AppConfig;
}
