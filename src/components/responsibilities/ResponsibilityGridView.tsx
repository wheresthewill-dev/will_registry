import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  FileText,
  Info,
  Clock,
  UserPlus,
  Siren,
} from "lucide-react";
import { getInvitationStatus } from "@/app/utils/invitationStatus";
import AcceptInvitationModal from "../../app/dashboard/responsibilities/modals/AcceptInvitationModal";
import PersonCard, { InfoItem } from "../ui/person-card";
import { ICON_SIZES } from "@/app/constants/icons";
import { formatDate } from "@/utils/formatDate";
import { getUserInitials } from "@/utils/getUserInitials";
import { RESPONSIBILITY_ROLES } from "@/app/constants/userRoles";
import { ROUTES } from "@/app/constants/routes";
import { isUserDeceased } from "@/app/utils/repo_services/interfaces/user";
import RepresentativeNotified from "../custom/representative-notified";

interface ResponsibilityGridViewProps {
  responsibilities: any[];
  getUserDetails: (userId: number) => any;
  isAccepting: string | null;
  handleAcceptRepresentativeInvitation: (responsibility: any) => void;
  handleAcceptEmergencyContactInvitation: (responsibility: any) => void;
  handleViewWill: (userId: number, userName: string) => void;
}

export function ResponsibilityGridView({
  responsibilities,
  getUserDetails,
  isAccepting,
  handleAcceptRepresentativeInvitation,
  handleAcceptEmergencyContactInvitation,
  handleViewWill,
}: ResponsibilityGridViewProps) {
  const router = useRouter();

  // Handle navigation to emergency contact management page
  const handleViewEmergencyContactDetails = (responsibility: any) => {
    router.push(`${ROUTES.emergencyDetails}/${responsibility.id}`);
  };

  // Helper function to format relationship text
  const formatRelationship = (relationship?: string) => {
    if (!relationship) return "";
    return relationship.charAt(0).toUpperCase() + relationship.slice(1);
  };

  // Helper function to get role text based on responsibility type and status
  const getRoleText = (
    isRepresentative: boolean,
    relationship?: string,
    isPending = false
  ) => {
    const prefix = isPending ? "You're invited as an " : "You're an ";
    const role = isRepresentative
      ? RESPONSIBILITY_ROLES.representative.title
      : `${RESPONSIBILITY_ROLES.emergencyContact.title} (${formatRelationship(relationship)})`;

    return prefix + role;
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {responsibilities.map((responsibility) => {
        const userDetails = getUserDetails(responsibility.user_id);
        if (!userDetails) return null;

        const isRepresentative = "ar_user_id" in responsibility;
        const isActive = responsibility.status === "registered";
        const invitationStatus = getInvitationStatus(
          responsibility.status,
          responsibility.invite_expires
        );
        const userIsDeceased = isUserDeceased(userDetails);

        return (
          <PersonCard
            key={responsibility.id}
            name={`${userDetails.firstname} ${userDetails.lastname}`}
            initials={getUserInitials(
              userDetails.firstname,
              userDetails.lastname
            )}
            status={
              userIsDeceased
                ? "deceased"
                : isActive
                  ? "active"
                  : invitationStatus === "expired"
                    ? "expired"
                    : "pending"
            }
            footerContent={
              userIsDeceased ? (
                isRepresentative ? (
                  <Button
                    className="w-full"
                    onClick={() =>
                      handleViewWill(
                        responsibility.user_id,
                        `${userDetails.firstname} ${userDetails.lastname}`
                      )
                    }
                  >
                    <FileText className="mr-2" />
                    View Will Documents
                  </Button>
                ) : (
                  <div className="w-full text-center p-2 text-sm text-muted-foreground italic bg-slate-50 rounded-md border border-slate-200">
                    <RepresentativeNotified
                      willOwnerFirstname={userDetails.firstname}
                    />
                  </div>
                )
              ) : invitationStatus === "expired" ? (
                <div className="w-full text-center p-2 text-sm text-muted-foreground italic bg-muted/20 rounded-md">
                  Invitation has expired
                </div>
              ) : responsibility.status === "pending" ? (
                <AcceptInvitationModal
                  responsibility={responsibility}
                  userDetails={userDetails}
                  onAccept={
                    isRepresentative
                      ? handleAcceptRepresentativeInvitation
                      : handleAcceptEmergencyContactInvitation
                  }
                  isAccepting={isAccepting === responsibility.id}
                  type={
                    isRepresentative ? "representative" : "emergency-contact"
                  }
                />
              ) : isRepresentative ? (
                <Button
                  className="w-full"
                  onClick={() =>
                    handleViewWill(
                      responsibility.user_id,
                      `${userDetails.firstname} ${userDetails.lastname}`
                    )
                  }
                >
                  <FileText className="mr-2" />
                  View Will Documents
                </Button>
              ) : (
                <div className="flex flex-col gap-2 w-full">
                  <Button
                    className="w-full"
                    variant="default"
                    onClick={() =>
                      handleViewEmergencyContactDetails(responsibility)
                    }
                  >
                    <Siren className="mr-2" />
                    Emergency Details
                  </Button>
                </div>
              )
            }
          >
            {/* Invitation Details section */}
            <>
              <InfoItem icon={<UserPlus className={ICON_SIZES.sm} />}>
                {invitationStatus === "active" || invitationStatus === "pending"
                  ? getRoleText(
                      isRepresentative,
                      responsibility.relationship,
                      invitationStatus === "pending"
                    )
                  : ""}
              </InfoItem>

              <InfoItem icon={<Mail className={ICON_SIZES.sm} />}>
                {userDetails.email}
              </InfoItem>

              {!isRepresentative && responsibility.contact_number && (
                <InfoItem icon={<Phone className={ICON_SIZES.sm} />}>
                  {responsibility.contact_number}
                </InfoItem>
              )}

              <InfoItem
                icon={<Calendar className={ICON_SIZES.sm} />}
                textColorClass="text-muted-foreground"
              >
                {isActive ? "Accepted" : "Received"} on{" "}
                {formatDate(
                  isActive && responsibility.registered_at
                    ? responsibility.registered_at
                    : responsibility.created_at
                )}
              </InfoItem>

              {responsibility.status === "pending" &&
                responsibility.invite_expires && (
                  <>
                    {(() => {
                      const expiryDate = new Date(
                        responsibility.invite_expires
                      );
                      const now = new Date();
                      const diffTime = expiryDate.getTime() - now.getTime();
                      const diffDays = Math.ceil(
                        diffTime / (1000 * 60 * 60 * 24)
                      );

                      if (invitationStatus === "expired") {
                        return (
                          <InfoItem
                            icon={<AlertCircle className="h-3.5 w-3.5" />}
                            textColorClass="text-destructive font-medium"
                          >
                            Invitation expired on{" "}
                            {formatDate(expiryDate.toLocaleDateString())}
                          </InfoItem>
                        );
                      } else if (diffDays === 1) {
                        return (
                          <InfoItem
                            icon={<Clock className="h-3.5 w-3.5" />}
                            textColorClass="text-amber-600 font-medium"
                          >
                            Invitation expires tomorrow
                          </InfoItem>
                        );
                      } else {
                        return (
                          <InfoItem
                            icon={<Clock className="h-3.5 w-3.5" />}
                            textColorClass="text-amber-600 font-medium"
                          >
                            Invitation expires in {diffDays} days
                          </InfoItem>
                        );
                      }
                    })()}
                  </>
                )}
            </>
          </PersonCard>
        );
      })}
    </div>
  );
}

export default ResponsibilityGridView;
