"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  FlexibleRadioCard,
  FlexibleRadioGroup,
} from "@/components/custom/flexible_radio";
import { usePersonalDetailsForm } from "../../hooks/useRegistrationForm";
import {
  PERSONAL_DETAILS,
  ADDRESS_DETAILS,
  PHONE_DETAILS,
  LOGIN_DETAILS,
} from "@/app/constants/form-field-constants";
import { CheckboxWithDescription } from "@/components/checkbox";
import FormSection from "../form/FormSectionContainer";
import { useRegistrationStore } from "@/stores/formStore";
import StepNavigationWrapper from "../form/StepNavigationWrapper";
import StepHeader from "./StepHeader";
import { Card } from "@/components/ui/card";

export default function Step2UserProfile() {
  const form = usePersonalDetailsForm();
  const { userProfile, setUserProfile, updateUserProfileField } =
    useRegistrationStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync form -> store in real-time
  useEffect(() => {
    const subscription = form.watch((values, { name, type }) => {
      if (name && type === "change" && values[name] !== undefined) {
        updateUserProfileField(name as keyof typeof userProfile, values[name]);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, updateUserProfileField, userProfile]);

  // Reset form on mount to store values
  useEffect(() => {
    form.reset(userProfile);
  }, [userProfile]);

  // On submit, update store with all form data
  const onSubmit = (data: any) => {
    setUserProfile(data);
    setLoading(true);
    setError("");
    console.log("Submitted Data:", data);
    console.log("User Profile in Store:", userProfile);
  };

  return (
    <div className="max-w-sm md:max-w-screen xl:px-30 mx-auto">
      <Card className="px-8 lg:px-25">
        <StepHeader
          title={"Profile Details"}
          description={"Create your account by filling in your details"}
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormSection
              fields={[...PERSONAL_DETAILS]}
              title={"Personal Details"}
              description={
                "Please provide your personal information to create your account."
              }
              gridColumns={"xl:grid-cols-3"}
              control={form.control}
            />
            <Separator className="my-10" />
            <FormSection
              fields={[...ADDRESS_DETAILS]}
              title={"Address Details"}
              description={
                "Providing your current address is optional but recommended if you're living abroad. You may update it anytime in your Personal Profile."
              }
              gridColumns={"xl:grid-cols-2"}
              control={form.control}
            />
            <Separator className="my-10" />
            <FormSection
              fields={[...PHONE_DETAILS]}
              title={"Phone Details"}
              description={"Please provide at least one of your phone details."}
              gridColumns={"xl:grid-cols-3"}
              control={form.control}
            />
            <Separator className="my-10" />
            <FormSection
              fields={[...LOGIN_DETAILS]}
              title={"Login Details"}
              description={
                "Please provide a personal email address that you access regularly. Avoid using work emails or inactive free accounts."
              }
              gridColumns={"xl:grid-cols-2"}
              control={form.control}
            />
            <Separator className="my-10" />
            <FormSection
              title={"Privacy"}
              gridColumns={"lg:grid-cols-1"}
              control={form.control}
              description={
                <>
                  Would you like others to know you&apos;re registered with
                  theinternationwillregistry.com?
                  <ul className="list-disc mt-2 ml-10 space-y-1">
                    <li>
                      If you choose <span className="font-bold">Yes</span>,
                      people can search the site and see that you have an
                      account — but not your personal or document details.
                    </li>
                    <li>
                      If you choose <span className="font-bold">No</span>, only
                      you and your Authorised Representatives will know.
                    </li>
                  </ul>
                </>
              }
              children={
                <FormField
                  name="privacyPolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FlexibleRadioGroup<boolean>
                          onValueChange={field.onChange}
                          className="text-sm grid grid-cols-1 gap-4 sm:grid-cols-2"
                          value={field.value}
                        >
                          <FlexibleRadioCard<boolean>
                            value={true}
                            title="YES - Let others see that I have an account"
                          />
                          <FlexibleRadioCard<boolean>
                            value={false}
                            title="NO - Keep my account private"
                          />
                        </FlexibleRadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              }
            />
            <Separator className="my-10" />
            <FormSection
              control={form.control}
              title={"Declaration"}
              gridColumns={"lg:grid-cols-1"}
              children={
                <FormField
                  name="declaration"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <CheckboxWithDescription
                          defaultChecked={field.value}
                          value={field.value}
                          onChange={field.onChange}
                          id={field.name}
                          label={"Accept Terms and Conditions"}
                          description="I have read, understood, and agree to the Terms of Use, Privacy Policy, Security Policy, and Intellectual Property Notice. I agree not to misuse the services of InternationalWillRegistry.com or use them for improper purposes."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              }
            />
            <StepNavigationWrapper form={form} />
          </form>
        </Form>
      </Card>
    </div>
  );
}
