"use client";

import React from "react";
import { useRegistrationStore } from "@/stores/formStore";
import { SubscriptionLevel } from "@/app/utils/repo_services/interfaces/user_subscription";
import { SubscriptionTiersGrid } from "@/components/custom/subscription-grid";
import StepHeader from "./StepHeader";
import StepNavigationWrapper from "../form/StepNavigationWrapper";
import { useAppConfig } from "@/app/utils/repo_services/hooks/app_config";

export default function Step1Subscriptions() {
  const { subscriptionPlan, setSubscriptionPlan } = useRegistrationStore();
  const { data: appConfig } = useAppConfig();

  // Handle selection change - take the first selected plan
  const handleSelectionChange = (selected: SubscriptionLevel[]) => {
    if (selected.length > 0) {
      setSubscriptionPlan(selected[0]);
    }
    console.log(selected);
  };

  return (
    <>
      <StepHeader
        title={"Choose Your Subscription Plan"}
        description={"Select the subscription plan that best fits your needs"}
      />
      <SubscriptionTiersGrid
        defaultSelected={subscriptionPlan ? [subscriptionPlan] : []}
        onSelectionChange={handleSelectionChange}
        isCardClickable={true}
        appConfig={appConfig}
      />
      <div className="mt-8">
        <StepNavigationWrapper />
      </div>
    </>
  );
}
