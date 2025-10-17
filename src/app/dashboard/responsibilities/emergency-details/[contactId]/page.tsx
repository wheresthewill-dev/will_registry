"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Bell,
  ArrowLeft,
  AlertTriangle,
  InfoIcon,
  UserCircle,
  CheckCircle2,
} from "lucide-react";
import { UserEmergencyContact } from "@/app/utils/repo_services/interfaces/user_emergency_contact";
import {
  User,
  isUserDeceased,
  getUserStatus,
} from "@/app/utils/repo_services/interfaces/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getUserInitials } from "@/utils/getUserInitials";
import { isRepresentativeActive } from "@/app/utils/repo_services/interfaces/user_authorized_representative";
import { NotifyRepresentativesDialog } from "@/components/responsibilities/NotifyRepresentativesDialog";
import { useUserEmergencyContacts } from "@/app/utils/repo_services/hooks/user_emergency_contact";
import { toast } from "sonner";

// Interfaces for data structures
interface AuthorizedRepresentative {
  id: number | string;
  name: string;
  email?: string;
  isActive: boolean;
}

interface EmergencyContactData {
  contact: UserEmergencyContact & { email?: string };
  user: User;
  authorizedRepresentatives: Array<AuthorizedRepresentative>;
}

// Generic API fetch function
const fetchApi = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `API error: ${response.status} ${response.statusText}`,
      errorText
    );
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return await response.json();
};

// Function to fetch emergency contact data from the API
const getEmergencyContactData = async (
  contactId: string
): Promise<EmergencyContactData | null> => {
  try {
    // Fetch the emergency contact details
    const contactData = await fetchApi<any>(
      API_ENDPOINTS.EMERGENCY_CONTACT(contactId)
    );

    if (!contactData.success || !contactData.contact) {
      throw new Error(contactData.error || "Failed to fetch contact data");
    }

    // Fetch user details (the person who the emergency contact is for)
    const userId = contactData.contact.user_id;
    const userData = await fetchApi<any>(API_ENDPOINTS.USER_DETAILS(userId));

    // Get the emergency contact's email (current user) if available from the contact data
    // This will help identify if the emergency contact is also an authorized representative
    const contactEmail = contactData.contact.email || contactData.contactEmail;

    // Fetch authorized representatives for this user
    let authorizedReps: AuthorizedRepresentative[] = [];

    try {
      const arData = await fetchApi<any>(
        API_ENDPOINTS.USER_REPRESENTATIVES(userId)
      );

      if (arData.representatives && Array.isArray(arData.representatives)) {
        // Use the isRepresentativeActive function to filter registered representatives
        authorizedReps = arData.representatives.map((rep: any) => ({
          id: rep.id || rep.ar_user_id,
          name:
            `${rep.firstname || ""} ${rep.lastname || ""}`.trim() ||
            "Representative",
          email: rep.email,
          isActive: isRepresentativeActive(rep),
        }));
      }
    } catch (error) {
      console.error("Failed to fetch representatives:", error);
      // Continue with empty representatives array
    }

    return {
      contact: {
        ...contactData.contact,
        email: contactEmail,
      },
      user: userData.user,
      authorizedRepresentatives: authorizedReps,
    };
  } catch (error) {
    console.error("Error fetching emergency contact data:", error);
    return null;
  }
};

// API endpoints
const API_ENDPOINTS = {
  EMERGENCY_CONTACT: (id: string) =>
    `/api/documents/emergency-contact?contactId=${id}`,
  USER_DETAILS: (id: string) => `/api/users/by-id?userId=${id}`,
  USER_REPRESENTATIVES: (id: string) =>
    `/api/users/by-id/representatives?userId=${id}`,
};

// RepresentativesList component
interface RepresentativesListProps {
  responsibility: UserEmergencyContact; // Single responsibility object since this is for a specific contact
  representatives: AuthorizedRepresentative[];
  ownnerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  contactEmail?: string; // Current user's email to check if they are also an authorized representative
  handleNotifyRepresentatives?: (responsibilityId: string) => Promise<void>;
  isNotifying?: string | null;
  isDeceased?: boolean; // Whether the estate owner is already marked as deceased
}

// UserProfileCard component
interface UserProfileCardProps {
  firstName: string;
  lastName: string;
  relationship: string;
}

const UserProfileCard = ({
  firstName,
  lastName,
  relationship,
}: UserProfileCardProps) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg border">
      <Avatar className="h-14 w-14 border border-muted shadow-sm">
        <AvatarFallback className="bg-primary text-primary-foreground font-medium">
          {getUserInitials(firstName, lastName)}
        </AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-medium text-lg">
          {firstName || "User"} {lastName || ""}
        </h3>
        <div className="flex items-center text-muted-foreground text-sm">
          <span>You are their</span>
          <span className="px-1 bg-secondary text-secondary-foreground rounded-md text-sm font-medium">
            {relationship}
          </span>
        </div>
      </div>
    </div>
  );
};

const RepresentativesList = ({
  representatives,
  responsibility,
  ownnerFirstName,
  ownerLastName,
  ownerEmail,
  contactEmail,
  handleNotifyRepresentatives,
  isNotifying = null,
  isDeceased = false,
}: RepresentativesListProps) => {
  // Filter only active representatives using the imported isRepresentativeActive function
  const activeRepresentatives = representatives.filter((rep) => rep.isActive);
  const hasRepresentatives = activeRepresentatives.length > 0;

  if (!hasRepresentatives) {
    return (
      <div className="border rounded-lg p-8 text-center space-y-3 bg-muted/30">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <UserCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="font-medium">No representatives assigned</h3>
          <p className="text-sm text-muted-foreground">
            {ownnerFirstName} has not assigned any authorised representatives
            yet. You'll see them here once they're added.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium">Authorised Representatives</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p>
                These are the people who need to be notified in case of
                emergency. You can see their names but not their email addresses
                or contact details.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="ml-auto">
          {isDeceased ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Representatives have been notified</span>
            </div>
          ) : (
            handleNotifyRepresentatives &&
            responsibility && (
              <NotifyRepresentativesDialog
                responsibility={responsibility}
                userDetails={{
                  firstname: ownnerFirstName || "",
                  lastname: ownerLastName || "",
                  email: ownerEmail || "",
                }}
                onNotify={handleNotifyRepresentatives}
                isNotifying={isNotifying === responsibility.id}
              />
            )
          )}
        </div>
      </div>
      <div className="space-y-3">
        {activeRepresentatives.map((rep) => {
          // Check if the current emergency contact is also this representative
          const isCurrentUser = contactEmail && rep.email === contactEmail;
          return (
            <div key={rep.id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {rep.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {rep.name}
                      {isCurrentUser && (
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          You
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function EmergencyContactManagementPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params?.contactId as string;

  // Use the emergency contacts hook for death notification functionality
  const { notifyRepresentativesOfDeath } = useUserEmergencyContacts();

  const [contactData, setContactData] = useState<EmergencyContactData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<
    string | undefined
  >();
  const [isNotifying, setIsNotifying] = useState<string | null>(null);

  // Get current user session to determine email for comparison
  useEffect(() => {
    // This would typically come from an authentication provider or API call
    // For demonstration, we'll get it from localStorage, cookie, or other state management
    const fetchUserSession = async () => {
      try {
        // Simulated user session - in a real app, replace with actual auth provider call
        // Example: const session = await supabase.auth.getSession();
        // const email = session?.user?.email;
        const email =
          localStorage.getItem("userEmail") ||
          sessionStorage.getItem("userEmail");
        setCurrentUserEmail(email || undefined);
      } catch (error) {
        console.error("Could not get current user session", error);
      }
    };

    fetchUserSession();
  }, []);

  useEffect(() => {
    const loadContactData = async () => {
      if (!contactId) {
        setError("Missing contact ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getEmergencyContactData(contactId);

        if (!data) {
          throw new Error("Failed to retrieve emergency contact data");
        }

        setContactData(data);
        setError(null);
      } catch (err: any) {
        console.error("Error in emergency contact page:", err);
        setError(err.message || "Failed to load emergency contact data");
        setContactData(null);
      } finally {
        setLoading(false);
      }
    };

    loadContactData();
  }, [contactId]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>

        {/* Contact info skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User info skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AR skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-56" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  // Handle notifying representatives when someone is deceased
  const handleNotifyRepresentatives = async (responsibilityId: string) => {
    if (!contactData) {
      toast.error("Contact data not available");
      return;
    }

    setIsNotifying(responsibilityId);

    try {
      const emergencyContactName =
        `${contactData.contact.firstname || ""} ${contactData.contact.lastname || ""}`.trim() ||
        "Emergency Contact";
      const emergencyContactRelationship =
        contactData.contact.relationship || "emergency contact";

      const result = await notifyRepresentativesOfDeath(
        contactId,
        contactData.user.id,
        emergencyContactName,
        emergencyContactRelationship
      );

      if (result.success && result.details) {
        const { emailsSent, emailsFailed, totalRepresentatives } =
          result.details;

        if (emailsFailed > 0) {
          toast.success(
            `Representatives notified successfully. ${emailsSent} of ${totalRepresentatives} emails sent.`,
            { duration: 5000 }
          );
        } else {
          toast.success(
            `All ${emailsSent} representatives have been notified successfully.`,
            { duration: 5000 }
          );
        }

        // Refresh the page data to reflect the updated status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.error || "Failed to notify representatives");
      }
    } catch (error) {
      console.error("Error notifying representatives:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to notify representatives. Please try again.";
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setIsNotifying(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Emergency Details</h1>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">
            You are an emergency contact for{" "}
            <span className="font-medium text-foreground">
              {contactData?.user?.firstname || "the"}{" "}
              {contactData?.user?.lastname || "user"}
            </span>
          </p>
        </div>
      </div>

      {/* Deceased status alert */}
      {contactData?.user && isUserDeceased(contactData.user) && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">
            Notification Completed
          </AlertTitle>
          <AlertDescription className="text-green-700">
            The authorized representatives for {contactData.user.firstname}{" "}
            {contactData.user.lastname}
            have already been notified of their passing. They now have access to
            estate documents and responsibilities.
          </AlertDescription>
        </Alert>
      )}

      {/* Main contact card */}
      <Card className="border overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Emergency Contact Information
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Contact information section */}
          <div className="space-y-6">
            {/* User profile */}
            <UserProfileCard
              firstName={contactData?.user?.firstname || ""}
              lastName={contactData?.user?.lastname || ""}
              relationship={
                contactData?.contact?.relationship ||
                "trusted emergency contact"
              }
            />

            {/* Role description */}
            <Alert className="border-l-4">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Your Role as an Emergency Contact</AlertTitle>
              <AlertDescription>
                <div className="space-y-3">
                  <p>
                    As an Emergency Contact for{" "}
                    {contactData?.user?.firstname || "the estate owner"}, please
                    notify these representatives as soon as possible. They have
                    access to important will documents and should be informed
                    immediately.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <Separator />

            {/* Authorized Representatives section */}
            <div className="space-y-4">
              {contactData?.contact && (
                <RepresentativesList
                  representatives={contactData.authorizedRepresentatives || []}
                  responsibility={contactData.contact}
                  ownnerFirstName={
                    contactData.user?.firstname || "The estate owner"
                  }
                  ownerLastName={contactData.user?.lastname || ""}
                  ownerEmail={contactData.user?.email || ""}
                  contactEmail={currentUserEmail || contactData.contact?.email}
                  handleNotifyRepresentatives={handleNotifyRepresentatives}
                  isNotifying={isNotifying}
                  isDeceased={
                    contactData.user ? isUserDeceased(contactData.user) : false
                  }
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
