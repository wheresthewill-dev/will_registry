"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  Loader2,
  ShieldAlert,
  UserX,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface NotifyRepresentativesDialogProps {
  responsibility: any;
  userDetails: {
    firstname: string;
    lastname: string;
    email: string;
  };
  onNotify: (responsibilityId: string) => Promise<void>;
  isNotifying?: boolean;
}

type ValidationStep = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  required: boolean;
};

export function NotifyRepresentativesDialog({
  responsibility,
  userDetails,
  onNotify,
  isNotifying = false,
}: NotifyRepresentativesDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [confirmationText, setConfirmationText] = useState("");
  const [finalCheckbox, setFinalCheckbox] = useState(false);

  // Step 1: Initial validation checks
  const [validationChecks, setValidationChecks] = useState<ValidationStep[]>([
    {
      id: "verified-deceased",
      label: "I have verified that the person is deceased",
      description:
        "I confirm that I have official confirmation or verified information about the person's passing",
      checked: false,
      required: true,
    },
    {
      id: "authorised-role",
      label: "I am authorised to take this action",
      description:
        "As an emergency contact, I have the authority to notify authorised representatives",
      checked: false,
      required: true,
    },
    {
      id: "understand-irreversible",
      label: "I understand this action is irreversible",
      description:
        "Once notified, the user account will be marked as deceased and cannot be undone",
      checked: false,
      required: true,
    },
    {
      id: "accurate-information",
      label: "The information I'm providing is accurate",
      description:
        "I confirm that all information regarding this notification is truthful and accurate",
      checked: false,
      required: true,
    },
  ]);

  // Step 2: Impact awareness checks
  const [impactChecks, setImpactChecks] = useState<ValidationStep[]>([
    {
      id: "account-marked",
      label: "The user account will be permanently marked as deceased",
      description:
        "The system will record the date of passing and prevent future logins",
      checked: false,
      required: true,
    },
    {
      id: "reps-notified",
      label: "All authorised representatives will be notified immediately",
      description:
        "Representatives will receive detailed notifications about the passing and next steps",
      checked: false,
      required: true,
    },
    {
      id: "access-changes",
      label: "Document access and permissions will be transferred",
      description:
        "Authorized representatives will gain access to estate documents as configured",
      checked: false,
      required: true,
    },
    {
      id: "audit-trail",
      label: "This action will create a permanent audit trail",
      description:
        "Your notification will be logged with timestamp and cannot be deleted",
      checked: false,
      required: true,
    },
  ]);

  const userName = `${userDetails.firstname} ${userDetails.lastname}`;
  const expectedConfirmation = `NOTIFY ${userDetails.lastname.toUpperCase()}`;

  // Check if all required validation checks are complete
  const allValidationChecksComplete = validationChecks.every(
    (check) => !check.required || check.checked
  );

  // Check if all required impact checks are complete
  const allImpactChecksComplete = impactChecks.every(
    (check) => !check.required || check.checked
  );

  // Check if confirmation text matches
  const confirmationMatches =
    confirmationText.trim().toUpperCase() === expectedConfirmation;

  // Check if final checkbox is checked
  const canProceed =
    allValidationChecksComplete &&
    allImpactChecksComplete &&
    confirmationMatches &&
    finalCheckbox;

  const handleCheckChange = (
    checkId: string,
    checked: boolean,
    step: 1 | 2
  ) => {
    if (step === 1) {
      setValidationChecks((prev) =>
        prev.map((check) =>
          check.id === checkId ? { ...check, checked } : check
        )
      );
    } else {
      setImpactChecks((prev) =>
        prev.map((check) =>
          check.id === checkId ? { ...check, checked } : check
        )
      );
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && allValidationChecksComplete) {
      setCurrentStep(2);
    } else if (currentStep === 2 && allImpactChecksComplete) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed || isNotifying) return;

    try {
      await onNotify(responsibility.id);
      handleClose();
    } catch (error) {
      console.error("Failed to notify representatives:", error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset all state after dialog closes
    setTimeout(() => {
      setCurrentStep(1);
      setConfirmationText("");
      setFinalCheckbox(false);
      setValidationChecks((prev) =>
        prev.map((check) => ({ ...check, checked: false }))
      );
      setImpactChecks((prev) =>
        prev.map((check) => ({ ...check, checked: false }))
      );
    }, 200);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              className="animate-pulse shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
              onClick={() => setOpen(true)}
            >
              <Bell />
              Notify Representatives
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              Notify representatives in case of emergency
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <ShieldAlert className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl">
                  Notify Authorized Representatives
                </DialogTitle>
                <DialogDescription className="mt-2">
                  This is a critical action that will notify all authorised
                  representatives that{" "}
                  <span className="font-semibold">{userName}</span> has passed
                  away.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 py-4">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors",
                    currentStep === step
                      ? "border-primary bg-primary text-primary-foreground"
                      : currentStep > step
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {currentStep > step ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={cn(
                      "h-0.5 w-12 transition-colors",
                      currentStep > step
                        ? "bg-green-600"
                        : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Initial Validation */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-900 dark:text-amber-200">
                  <p className="font-semibold mb-1">Step 1: Verification</p>
                  <p>
                    Please carefully read and confirm each statement below. All
                    items must be checked to proceed.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {validationChecks.map((check, index) => (
                  <div
                    key={check.id}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-colors",
                      check.checked
                        ? "border-green-600 bg-green-50 dark:bg-green-950/20"
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={check.id}
                        checked={check.checked}
                        onCheckedChange={(checked) =>
                          handleCheckChange(check.id, checked as boolean, 1)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={check.id}
                          className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                        >
                          <span className="text-xs text-muted-foreground">
                            {index + 1}.
                          </span>
                          {check.label}
                          {check.required && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1.5 py-0 text-white bg-red-400"
                            >
                              Required
                            </Badge>
                          )}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {check.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  All verification checks must be completed before you can
                  proceed to the next step.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 2: Impact Awareness */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900 dark:text-blue-200">
                  <p className="font-semibold mb-1">Step 2: Impact Awareness</p>
                  <p>
                    Review and acknowledge the consequences of this action. This
                    helps ensure you understand the full impact.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {impactChecks.map((check, index) => (
                  <div
                    key={check.id}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-colors",
                      check.checked
                        ? "border-green-600 bg-green-50 dark:bg-green-950/20"
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={check.id}
                        checked={check.checked}
                        onCheckedChange={(checked) =>
                          handleCheckChange(check.id, checked as boolean, 2)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={check.id}
                          className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                        >
                          <span className="text-xs text-muted-foreground">
                            {index + 1}.
                          </span>
                          {check.label}
                          {check.required && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1.5 py-0 text-white bg-red-400"
                            >
                              Required
                            </Badge>
                          )}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {check.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  All impact acknowledgments must be completed before you can
                  proceed to final confirmation.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 3: Final Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                <UserX className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">
                    Step 3: Final Confirmation
                  </p>
                  <p className="text-muted-foreground">
                    This is your last chance to review. Once confirmed, this
                    action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-semibold mb-2">Action Summary:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>
                        <span className="font-medium">Person:</span> {userName}{" "}
                        ({userDetails.email})
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>
                        <span className="font-medium">Your Role:</span>{" "}
                        Emergency Contact (
                        {responsibility.relationship || "Unknown"})
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>
                        <span className="font-medium">Action:</span> Mark as
                        deceased and notify all authorised representatives
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>
                        <span className="font-medium">Effect:</span>{" "}
                        Irreversible - Account will be permanently marked as
                        deceased
                      </span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div>
                    <Label
                      htmlFor="confirmation-text"
                      className="font-semibold"
                    >
                      Type the following to confirm:{" "}
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {expectedConfirmation}
                      </code>
                    </Label>
                    <Input
                      id="confirmation-text"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      placeholder="Type confirmation text here"
                      className={cn(
                        "mt-2 font-mono",
                        confirmationText &&
                          (confirmationMatches
                            ? "border-green-600"
                            : "border-destructive")
                      )}
                    />
                    {confirmationText && !confirmationMatches && (
                      <p className="text-xs text-destructive mt-1">
                        Confirmation text does not match. Please type exactly:{" "}
                        {expectedConfirmation}
                      </p>
                    )}
                  </div>

                  <div className="flex items-start gap-3 p-3 border-2 border-destructive rounded-lg">
                    <Checkbox
                      id="final-confirmation"
                      checked={finalCheckbox}
                      onCheckedChange={(checked) =>
                        setFinalCheckbox(checked as boolean)
                      }
                      className="mt-1"
                    />
                    <Label
                      htmlFor="final-confirmation"
                      className="text-sm font-medium leading-tight cursor-pointer"
                    >
                      I understand that this action is permanent and
                      irreversible. I confirm that {userName} has passed away
                      and I am authorised to notify their representatives.
                    </Label>
                  </div>
                </div>
              </div>

              {!canProceed && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please complete all required fields above before you can
                    submit this notification.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex-1 flex gap-2">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isNotifying}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isNotifying}
              >
                Cancel
              </Button>
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !allValidationChecksComplete) ||
                    (currentStep === 2 && !allImpactChecksComplete)
                  }
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleSubmit}
                  disabled={!canProceed || isNotifying}
                  className="gap-2"
                >
                  {isNotifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Notifying...
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4" />
                      Confirm & Notify
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
