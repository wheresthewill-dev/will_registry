"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { CountrySelect } from "@/components/country-select";
import { PhoneInput } from "@/components/phone-input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  ADDRESS_DETAILS,
  PHONE_DETAILS,
} from "@/app/constants/form-field-constants";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useAccountSettingsContext } from "@/contexts/AccountSettingsContext";

// Define validation schema with Zod
const profileSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Last name is required"),
    email: z
      .string()
      .email("Please enter a valid email")
      .min(1, "Email is required"),
    addressLine: z.string().min(1, "Address line is required"),
    addressTown: z.string().min(1, "Town/City is required"),
    addressState: z.string().min(1, "State/Province is required"),
    addressPostcode: z.string().min(1, "Postal/Zip code is required"),
    addressCountry: z.string().min(1, "Country is required"),
    mobilePhone: z.string(),
    homePhone: z.string(),
    workPhone: z.string(),
  })
  .refine((data) => data.mobilePhone || data.homePhone || data.workPhone, {
    message: "At least one contact phone number is required",
    path: ["mobilePhone"], // Shows error on the mobilePhone field
  });

type ProfileFormValues = z.infer<typeof profileSchema>;

// Alert state interface
interface AlertState {
  type: "success" | "error" | "none";
  title: string;
  description?: string;
}

export default function ProfileDetailsSection() {
  const { userData, setUserData, isLoading } = useAccountSettingsContext();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alertState, setAlertState] = useState<AlertState>({
    type: "none",
    title: "",
  });

  // Set up form with Zod validation
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      middleName: "",
      addressLine: "",
      addressCountry: "",
      addressState: "",
      addressTown: "",
      addressPostcode: "",
      homePhone: "",
      workPhone: "",
      mobilePhone: "",
    },
    mode: "onChange",
  });

  const { reset, control, formState, handleSubmit, getValues, watch } = form;
  const { errors, isDirty } = formState;

  // Initialize form data when user data is loaded
  useEffect(() => {
    if (userData) {
      reset({
        email: userData.email || "",
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        middleName: userData.middleName || "",
        addressLine: userData.addressLine || "",
        addressCountry: userData.addressCountry || "",
        addressState: userData.addressState || "",
        addressTown: userData.addressTown || "",
        addressPostcode: userData.addressPostcode || "",
        homePhone: userData.homePhone || "",
        workPhone: userData.workPhone || "",
        mobilePhone: userData.mobilePhone || "",
      });
    }
  }, [userData, reset]);

  // Clear alert after 5 seconds
  useEffect(() => {
    if (alertState.type !== "none") {
      const timer = setTimeout(() => {
        setAlertState({ type: "none", title: "" });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [alertState]);

  // Function to start editing
  const handleEditStart = () => {
    setIsEditingProfile(true);
    // Clear any existing alerts
    setAlertState({ type: "none", title: "" });
  };

  // Function to cancel editing
  const handleCancel = () => {
    reset();
    setIsEditingProfile(false);
    setAlertState({ type: "none", title: "" });
  };

  // Function to save changes
  const onSubmit = async (formData: ProfileFormValues) => {
    if (!isDirty) {
      setIsEditingProfile(false);
      return;
    }

    setIsSaving(true);
    // Clear any previous alert
    setAlertState({ type: "none", title: "" });

    try {
      // Get the values before reset to access what changed
      const currentValues = getValues();

      // Compare with userData to find what changed
      const changedFields = Object.keys(currentValues).reduce((acc, key) => {
        const fieldKey = key as keyof ProfileFormValues;
        if (
          userData &&
          currentValues[fieldKey] !==
            userData[fieldKey as keyof typeof userData]
        ) {
          acc[fieldKey] = currentValues[fieldKey];
        }
        return acc;
      }, {} as Partial<ProfileFormValues>);

      // Only update if there are changes
      if (Object.keys(changedFields).length > 0) {
        const success = await setUserData(changedFields);

        if (success) {
          setAlertState({
            type: "success",
            title: "Profile updated successfully",
            description: "Your profile information has been saved.",
          });
          setIsEditingProfile(false);
        } else {
          throw new Error("Failed to update profile");
        }
      } else {
        setIsEditingProfile(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setAlertState({
        type: "error",
        title: "Update failed",
        description:
          "There was a problem updating your profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const personalFields = [
    { id: "firstName", label: "First Name", required: true },
    {
      id: "middleName",
      label: "Middle Name",
      required: false,
      placeholder: "Optional",
    },
    { id: "lastName", label: "Last Name", required: true },
  ];

  const emptyPlaceholder = "—";

  // Watch all form values
  const allValues = watch();

  if (isLoading || !userData) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[250px] mb-2" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-6 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Manage your personal information displayed on your profile.
          </CardDescription>
        </div>
        {!isEditingProfile && (
          <Button variant="outline" onClick={handleEditStart}>
            Edit Profile
          </Button>
        )}
      </CardHeader>

      {/* Alert component for success/error messages */}
      {alertState.type !== "none" && (
        <div className="px-6 mb-4">
          <Alert
            variant={alertState.type === "success" ? "success" : "destructive"}
          >
            {alertState.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{alertState.title}</AlertTitle>
            {alertState.description && (
              <AlertDescription
                variant={
                  alertState.type === "success" ? "success" : "destructive"
                }
              >
                {alertState.description}
              </AlertDescription>
            )}
          </Alert>
        </div>
      )}

      <CardContent>
        {isEditingProfile ? (
          <FormProvider {...form}>
            <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
              {/* Personal Information Section */}
              <div>
                <h3 className="text-md font-medium mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {personalFields.map((field) => (
                    <FormField
                      key={field.id}
                      control={control}
                      name={field.id as keyof ProfileFormValues}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormLabel htmlFor={field.id}>
                            {field.label}
                            {field.required && (
                              <span className="text-destructive"> *</span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              id={field.id}
                              placeholder={field.placeholder}
                              {...formField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Address Information Section */}
              <div>
                <h3 className="text-md font-medium mb-4">
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ADDRESS_DETAILS.map((field) => (
                    <FormField
                      key={field.name}
                      control={control}
                      name={field.name as keyof ProfileFormValues}
                      render={({ field: formField }) =>
                        field.name === "addressCountry" ? (
                          <FormItem>
                            <FormLabel htmlFor="addressCountry">
                              Country
                              <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <CountrySelect
                                id="addressCountry"
                                value={formField.value}
                                onChange={formField.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        ) : (
                          <FormItem>
                            <FormLabel htmlFor={field.name}>
                              {field.label}
                              <span className="text-destructive"> *</span>
                            </FormLabel>
                            <FormControl>
                              <Input id={field.name} {...formField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Contact Information Section */}
              <div>
                <h3 className="text-md font-medium mb-4">
                  Contact Information
                </h3>
                {!allValues.mobilePhone &&
                  !allValues.homePhone &&
                  !allValues.workPhone && (
                    <p className="text-sm text-destructive mb-2">
                      At least one contact number is required
                    </p>
                  )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PHONE_DETAILS.map((field) => (
                    <FormField
                      key={field.name}
                      control={control}
                      name={field.name as keyof ProfileFormValues}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormLabel htmlFor={field.name}>
                            {field.label}
                          </FormLabel>
                          <FormControl>
                            <PhoneInput
                              value={formField.value}
                              onChange={(value: string) =>
                                formField.onChange(value)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            </form>
          </FormProvider>
        ) : (
          <div className="space-y-8">
            {/* Personal Information Display */}
            <div>
              <h3 className="text-md font-medium mb-4">Personal Information</h3>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    First Name
                  </dt>
                  <dd>{userData.firstName}</dd>
                </div>
                {userData.middleName && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Middle Name
                    </dt>
                    <dd>{userData.middleName}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Last Name
                  </dt>
                  <dd>{userData.lastName}</dd>
                </div>
              </dl>
            </div>

            <Separator />

            {/* Address Information Display */}
            <div>
              <h3 className="text-md font-medium mb-4">Address Information</h3>
              <dl className="grid grid-cols-1 gap-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Street Address
                  </dt>
                  <dd>{userData.addressLine || emptyPlaceholder}</dd>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Suburb or Town
                    </dt>
                    <dd>{userData.addressTown || emptyPlaceholder}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      State
                    </dt>
                    <dd>{userData.addressState || emptyPlaceholder}</dd>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Postcode
                    </dt>
                    <dd>{userData.addressPostcode || emptyPlaceholder}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Country
                    </dt>
                    <dd>{userData.addressCountry || emptyPlaceholder}</dd>
                  </div>
                </div>
              </dl>
            </div>

            <Separator />

            {/* Contact Information Display */}
            <div>
              <h3 className="text-md font-medium mb-4">Contact Information</h3>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Mobile Phone
                  </dt>
                  <dd>{userData.mobilePhone || emptyPlaceholder}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Home Phone
                  </dt>
                  <dd>{userData.homePhone || emptyPlaceholder}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Work Phone
                  </dt>
                  <dd>{userData.workPhone || emptyPlaceholder}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </CardContent>
      {isEditingProfile && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving || !isDirty || Object.keys(errors).length > 0}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
