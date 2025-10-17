import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Check, Shield, Users, Contact } from "lucide-react";
import { LoadingIndicator } from "@/components/custom/LoadingIndicator";
import { RESPONSIBILITY_ROLES } from "@/app/constants/userRoles";

interface AcceptInvitationModalProps {
  responsibility: any;
  userDetails: {
    firstname: string | null;
    lastname: string | null;
  };
  onAccept: (responsibility: any) => void;
  isAccepting: boolean;
  type: "representative" | "emergency-contact";
}

export function AcceptInvitationModal({
  responsibility,
  userDetails,
  onAccept,
  isAccepting,
  type,
}: AcceptInvitationModalProps) {
  const isRepresentative = type === "representative";
  const userName =
    `${userDetails.firstname || ""} ${userDetails.lastname || ""}`.trim();

  const roleType = isRepresentative ? "representative" : "emergencyContact";

  const getTitle = () => {
    return isRepresentative
      ? "Become an Authorised Representative"
      : "Become an Emergency Contact";
  };

  const getDescription = () => {
    const role = isRepresentative
      ? "Authorised Representative"
      : "Emergency Contact";
    return `${userName} would like you to serve as their ${role} ${isRepresentative ? "to help manage important documents and decisions" : "for urgent situations and assistance"}.`;
  };

  const getResponsibilities = () => {
    // Get key responsibilities for invitation modal (simplified list)
    return RESPONSIBILITY_ROLES[roleType].responsibilities
      .slice(0, 3)
      .map((item) => ({
        text: item.text,
      }));
  };

  // Use original Icon components directly
  const IconComponent = isRepresentative ? Users : Contact;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>
          <Check className="h-4 w-4 mr-2" />
          Accept Invitation
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="max-w-[480px] w-[95vw] p-0 gap-0 border-0 shadow-xl rounded-2xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 px-8 py-8 border-b border-slate-200/60">
          <AlertDialogHeader className="space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200/60">
              <IconComponent className="h-8 w-8 text-slate-700" />
            </div>

            <div className="text-center space-y-3">
              <AlertDialogTitle className="text-2xl font-semibold text-slate-900 tracking-tight leading-tight">
                {getTitle()}
              </AlertDialogTitle>

              <AlertDialogDescription className="text-base text-slate-600 leading-relaxed max-w-sm mx-auto">
                {getDescription()}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
        </div>

        {/* Content Section */}
        <div className="px-8 py-8 space-y-8">
          {/* Responsibilities */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                <Shield className="h-4 w-4 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">
                Your responsibilities
              </h3>
            </div>

            <div className="grid gap-3 pl-11">
              {getResponsibilities().map((item, index) => (
                <div key={index} className="flex items-start gap-3 group">
                  <div className="h-2 w-2 rounded-full bg-slate-400 mt-2.5 flex-shrink-0 group-hover:bg-slate-600 transition-colors" />
                  <span className="text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TODO: Uncomment Reassurance Note if users can modify or withdraw from a role */}
          {/* Reassurance Note */}
          {/* <div className="relative">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 mt-0.5 flex-shrink-0">
                <Clock className="h-3.5 w-3.5 text-slate-600" />
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                You can modify or withdraw from this role at any time through
                your account settings.
              </p>
            </div>
          </div> */}
        </div>

        {/* Footer Actions */}
        <AlertDialogFooter className="px-8 py-6 bg-slate-50/50 border-t border-slate-200/60 flex-col sm:flex-row gap-3 sm:gap-4 justify-between">
          <AlertDialogCancel className="md:mr-auto">
            Maybe Later
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={() => onAccept(responsibility)}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <LoadingIndicator text="Accepting..." />
            ) : (
              "Accept Invitation"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default AcceptInvitationModal;
