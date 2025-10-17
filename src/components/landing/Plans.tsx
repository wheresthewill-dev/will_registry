"use client";

import { SubscriptionTiersGrid } from "../custom/subscription-grid";
import { useAppConfig } from "@/app/utils/repo_services/hooks/app_config";

export default function Plans() {
  const { data: appConfig } = useAppConfig();
  
  return (
    <SubscriptionTiersGrid 
      isCardClickable={false} 
      useGetStartedButton 
      appConfig={appConfig}
    />
  );
}
