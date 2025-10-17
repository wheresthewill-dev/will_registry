"use client";

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
import {
  Send,
  AlertCircle,
  Timer,
  Info,
  Clock,
  Mail,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LoadingIndicator } from "@/components/custom/LoadingIndicator";
import { useUserSession } from "@/app/utils/repo_services/hooks/useUserSession";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/ui/status-badge";
import { ICON_SIZES } from "@/app/constants/icons";

// Types for configuration
export type InvitationType = "contact" | "representative";

export interface InvitationConfig {
  type: InvitationType;
  entityName: string; // "Emergency Contact" | "Representative"
  entityLabel: string; // "emergency contact" | "representative"
  storagePrefix: string; // "contact" | "representative"
}

export interface ResendInvitationModalProps {
  config: InvitationConfig;
  personId: string;
  personName: string;
  personEmail: string;
  personRelationship?: string;
  inviteExpires: string;
  invitationStatus: "pending" | "expired" | "active" | "registered";
  resendFunction: (
    id: string,
    token: string,
    expiryDate: Date
  ) => Promise<boolean>;
  onSuccess?: () => void | Promise<void>;
  triggerVariant?: "default" | "outline" | "ghost";
  triggerSize?: "sm" | "default" | "lg";
  triggerText?: string;
  showIcon?: boolean;
  iconOnly?: boolean;
  triggerId?: string;
  className?: string;
}

// Rate limiting constants
const BASE_COOLDOWN_MINUTES = 2; // Base cooldown time
const MAX_COOLDOWN_MINUTES = 15; // Maximum cooldown time
const MAX_RESEND_ATTEMPTS_PER_HOUR = 4; // Hourly limit
const MAX_RESEND_ATTEMPTS_PER_DAY = 10; // Daily limit

// Utility functions
const formatCooldownTime = (ms: number): string => {
  const minutes = Math.floor(ms / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

// Function to determine if an invitation has expired
const isInvitationExpired = (inviteExpires: string): boolean => {
  const expiryDate = new Date(inviteExpires);
  const now = new Date();
  return expiryDate.getTime() <= now.getTime();
};

const formatTimeRemaining = (inviteExpires: string): string => {
  const expiryDate = new Date(inviteExpires);
  const now = new Date();
  const timeUntilExpiry = expiryDate.getTime() - now.getTime();

  // Check if invitation has expired
  if (timeUntilExpiry <= 0) {
    return "expired";
  }

  // Calculate days remaining
  const days = Math.ceil(timeUntilExpiry / (1000 * 60 * 60 * 24));

  if (days > 1) {
    return `${days} days`;
  } else if (days === 1) {
    return "1 day";
  } else {
    // For less than a day, show hours remaining
    const hours = Math.ceil(timeUntilExpiry / (1000 * 60 * 60));
    return hours > 0 ? `${hours} hours` : "less than an hour";
  }
};

// Progressive cooldown calculation
const calculateProgressiveCooldown = (attemptCount: number): number => {
  // Progressive cooldown: 2min, 3min, 5min, 8min, 12min, 15min (max)
  // Formula: base * (1.5 ^ attemptCount) capped at maximum
  const progressiveCooldown =
    BASE_COOLDOWN_MINUTES * Math.pow(1.5, attemptCount);
  return Math.min(progressiveCooldown, MAX_COOLDOWN_MINUTES);
};

// Enhanced Rate limiting class with progressive cooldown and hourly limits
class AdvancedRateLimiter {
  private userId: string;
  private personId: string;
  private storagePrefix: string;

  constructor(userId: string, personId: string, storagePrefix: string) {
    this.userId = userId;
    this.personId = personId;
    this.storagePrefix = storagePrefix;
  }

  private getStorageKey(
    type: "last" | "hourly" | "daily" | "cooldown" | "attempts"
  ): string {
    const now = new Date();
    const today = now.toDateString();
    const currentHour = `${today}_${now.getHours()}`;
    const baseKey = `resend_${this.storagePrefix}_${this.userId}_${this.personId}`;

    switch (type) {
      case "last":
        return `${baseKey}_last`;
      case "hourly":
        return `${baseKey}_hourly_${currentHour}`;
      case "daily":
        return `${baseKey}_daily_${today}`;
      case "cooldown":
        return `${baseKey}_cooldown`;
      case "attempts":
        return `${baseKey}_attempts_${today}`;
      default:
        return baseKey;
    }
  }

  private getStoredValue(key: string): number {
    try {
      return parseInt(localStorage.getItem(key) || "0");
    } catch {
      return 0;
    }
  }

  private setStoredValue(key: string, value: number): void {
    try {
      localStorage.setItem(key, value.toString());
    } catch (error) {
      console.error("Failed to store rate limit data:", error);
    }
  }

  checkRateLimit(): {
    allowed: boolean;
    reason?: string;
    waitTime?: number;
    attemptsLeft?: {
      hourly: number;
      daily: number;
    };
    progressiveInfo?: {
      attemptCount: number;
      nextCooldown: number;
    };
  } {
    const now = Date.now();

    // Get current attempt count for progressive cooldown
    const attemptsKey = this.getStorageKey("attempts");
    const attemptCount = this.getStoredValue(attemptsKey);
    const nextCooldownMinutes = calculateProgressiveCooldown(attemptCount);

    // Check cooldown first (most restrictive)
    const cooldownKey = this.getStorageKey("cooldown");
    const cooldownEndTime = this.getStoredValue(cooldownKey);

    if (cooldownEndTime > now) {
      const waitTime = cooldownEndTime - now;
      const waitMinutes = Math.ceil(waitTime / (60 * 1000));
      return {
        allowed: false,
        reason: `Please wait ${waitMinutes} minute${waitMinutes > 1 ? "s" : ""} before trying again.`,
        waitTime,
        progressiveInfo: {
          attemptCount,
          nextCooldown: nextCooldownMinutes,
        },
      };
    }

    // Check hourly limit
    const hourlyKey = this.getStorageKey("hourly");
    const hourlyCount = this.getStoredValue(hourlyKey);
    const hourlyAttemptsLeft = MAX_RESEND_ATTEMPTS_PER_HOUR - hourlyCount;

    if (hourlyCount >= MAX_RESEND_ATTEMPTS_PER_HOUR) {
      return {
        allowed: false,
        reason: `Too many attempts. Please try again in the next hour.`,
        attemptsLeft: {
          hourly: 0,
          daily: Math.max(
            0,
            MAX_RESEND_ATTEMPTS_PER_DAY -
              this.getStoredValue(this.getStorageKey("daily"))
          ),
        },
        progressiveInfo: {
          attemptCount,
          nextCooldown: nextCooldownMinutes,
        },
      };
    }

    // Check daily limit
    const dailyKey = this.getStorageKey("daily");
    const dailyCount = this.getStoredValue(dailyKey);
    const dailyAttemptsLeft = MAX_RESEND_ATTEMPTS_PER_DAY - dailyCount;

    if (dailyCount >= MAX_RESEND_ATTEMPTS_PER_DAY) {
      return {
        allowed: false,
        reason: "Daily limit reached. Please try again tomorrow.",
        attemptsLeft: {
          hourly: 0,
          daily: 0,
        },
        progressiveInfo: {
          attemptCount,
          nextCooldown: nextCooldownMinutes,
        },
      };
    }

    return {
      allowed: true,
      attemptsLeft: {
        hourly: hourlyAttemptsLeft,
        daily: dailyAttemptsLeft,
      },
      progressiveInfo: {
        attemptCount,
        nextCooldown: nextCooldownMinutes,
      },
    };
  }

  updateAfterResend(): void {
    const now = Date.now();

    // Get current attempt count and calculate progressive cooldown
    const attemptsKey = this.getStorageKey("attempts");
    const currentAttemptCount = this.getStoredValue(attemptsKey);
    const cooldownMinutes = calculateProgressiveCooldown(currentAttemptCount);

    // Set progressive cooldown
    const cooldownMs = cooldownMinutes * 60 * 1000;
    const cooldownEndTime = now + cooldownMs;
    this.setStoredValue(this.getStorageKey("cooldown"), cooldownEndTime);

    // Increment attempt count (for next progressive cooldown calculation)
    this.setStoredValue(attemptsKey, currentAttemptCount + 1);

    // Update hourly count
    const hourlyKey = this.getStorageKey("hourly");
    const hourlyCount = this.getStoredValue(hourlyKey);
    this.setStoredValue(hourlyKey, hourlyCount + 1);

    // Update daily count
    const dailyKey = this.getStorageKey("daily");
    const dailyCount = this.getStoredValue(dailyKey);
    this.setStoredValue(dailyKey, dailyCount + 1);

    // Update last resend time
    this.setStoredValue(this.getStorageKey("last"), now);

    // Set expiry times for automatic cleanup
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    // Store expiry times for cleanup
    this.setStoredValue(`${hourlyKey}_expiry`, now + oneHour);
    this.setStoredValue(`${dailyKey}_expiry`, now + oneDay);
    this.setStoredValue(`${attemptsKey}_expiry`, now + oneDay);
    this.setStoredValue(
      `${this.getStorageKey("cooldown")}_expiry`,
      cooldownEndTime
    );
  }

  getCooldownTimeLeft(): number {
    const now = Date.now();
    const cooldownEndTime = this.getStoredValue(this.getStorageKey("cooldown"));
    return Math.max(0, cooldownEndTime - now);
  }

  getCurrentAttemptCount(): number {
    return this.getStoredValue(this.getStorageKey("attempts"));
  }

  cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      const today = new Date().toDateString();
      const currentHour = `${today}_${new Date().getHours()}`;

      keys.forEach((key) => {
        // Clean up expired entries
        if (
          key.includes(`resend_${this.storagePrefix}_${this.userId}_`) &&
          key.endsWith("_expiry")
        ) {
          const expiryTime = this.getStoredValue(key);
          if (expiryTime <= now) {
            const baseKey = key.replace("_expiry", "");
            localStorage.removeItem(key);
            localStorage.removeItem(baseKey);
          }
        }

        // Clean up old hourly entries (not current hour)
        if (
          key.includes(`resend_${this.storagePrefix}_${this.userId}_`) &&
          key.includes("_hourly_")
        ) {
          if (!key.includes(currentHour)) {
            localStorage.removeItem(key);
          }
        }

        // Clean up old daily entries (not today)
        if (
          key.includes(`resend_${this.storagePrefix}_${this.userId}_`) &&
          key.includes("_daily_")
        ) {
          if (!key.includes(today)) {
            localStorage.removeItem(key);
          }
        }

        // Clean up old attempt counters (not today)
        if (
          key.includes(`resend_${this.storagePrefix}_${this.userId}_`) &&
          key.includes("_attempts_")
        ) {
          if (!key.includes(today)) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error("Failed to cleanup expired entries:", error);
    }
  }

  // Reset attempt counter (for testing or manual reset)
  resetAttemptCounter(): void {
    try {
      localStorage.removeItem(this.getStorageKey("attempts"));
    } catch (error) {
      console.error("Failed to reset attempt counter:", error);
    }
  }
}

export default function ResendInvitationModal({
  config,
  personId,
  personName = "this person",
  personEmail,
  personRelationship,
  inviteExpires,
  invitationStatus,
  resendFunction,
  onSuccess,
  triggerVariant = "default",
  triggerSize = "default",
  triggerText,
  showIcon = true,
  iconOnly = false,
  triggerId,
  className,
}: ResendInvitationModalProps) {
  const router = useRouter();

  // Get current user from auth context
  const { user } = useUserSession();
  const currentUserId = user?.id || user?.email || "guest";

  // State management
  const [isResending, setIsResending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState<number>(0);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    allowed: boolean;
    reason?: string;
    attemptsLeft?: {
      hourly: number;
      daily: number;
    };
    progressiveInfo?: {
      attemptCount: number;
      nextCooldown: number;
    };
  } | null>(null);

  // Initialize advanced rate limiter with config-specific storage prefix
  const rateLimiter = new AdvancedRateLimiter(
    currentUserId,
    personId,
    config.storagePrefix
  );

  // Initialize component state from localStorage
  useEffect(() => {
    rateLimiter.cleanup();
    const initialCooldown = rateLimiter.getCooldownTimeLeft();
    setCooldownTimeLeft(initialCooldown);

    const limitCheck = rateLimiter.checkRateLimit();
    setRateLimitInfo(limitCheck);
  }, [currentUserId, personId, config.storagePrefix]);

  // Cooldown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (cooldownTimeLeft > 0) {
      interval = setInterval(() => {
        setCooldownTimeLeft((prev) => {
          const newTime = prev - 1000;
          if (newTime <= 0) {
            // Re-check rate limits when cooldown expires
            const limitCheck = rateLimiter.checkRateLimit();
            setRateLimitInfo(limitCheck);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldownTimeLeft]);

  // Handle resend invitation
  const handleResendInvitation = async () => {
    if (!personId) {
      toast.error("Cannot send invitation", {
        description: "Missing information. Please try again.",
        duration: 4000,
      });
      return;
    }

    // Check rate limits before proceeding
    const limitCheck = rateLimiter.checkRateLimit();
    if (!limitCheck.allowed) {
      toast.error("Cannot send invitation", {
        description: limitCheck.reason,
        duration: 6000,
      });
      return;
    }

    setIsResending(true);

    try {
      // Generate new token and expiry date
      const newToken = crypto.randomUUID();
      const newExpiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Call the resend API function and handle the boolean return value
      const success = await resendFunction(personId, newToken, newExpiryDate);

      if (success) {
        // Update rate limiting with progressive cooldown
        rateLimiter.updateAfterResend();

        // Update local state
        const newCooldown = rateLimiter.getCooldownTimeLeft();
        setCooldownTimeLeft(newCooldown);

        const updatedLimitInfo = rateLimiter.checkRateLimit();
        setRateLimitInfo(updatedLimitInfo);

        // Show simple success message
        toast.success("Invitation sent successfully!", {
          description: `${personName} will receive an email.`,
          duration: 4000,
        });

        // Close modal and refresh
        setIsOpen(false);
        if (onSuccess) await onSuccess();
        router.refresh();
      } else {
        // Handle failed resend
        toast.error("Could not send invitation", {
          description: "Please try again later.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Resend invitation error:", error);

      // Show simple error message
      toast.error("Something went wrong", {
        description: "Please try again.",
        duration: 4000,
      });
    } finally {
      setIsResending(false);
    }
  };

  // Calculate actual invitation status based on expiry date and provided status
  const actualInvitationStatus =
    invitationStatus === "registered"
      ? "registered"
      : isInvitationExpired(inviteExpires)
        ? "expired"
        : invitationStatus;

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // For registered users, show the status modal
      if (actualInvitationStatus === "registered") {
        setIsOpen(true); // Open modal to show registered status
        return;
      }

      // Check if invitation is still active/pending - prevent duplicate resends
      if (actualInvitationStatus === "pending") {
        setIsOpen(true); // Open modal to show status
        return;
      }

      // For expired invitations, check rate limits
      const limitCheck = rateLimiter.checkRateLimit();
      if (limitCheck.allowed) {
        setIsOpen(true);
      } else {
        toast.error("Cannot send invitation", {
          description: limitCheck.reason,
          duration: 6000,
        });
      }
    } else {
      setIsOpen(false);
    }
  };

  // Determine button state
  const isDisabled =
    isResending ||
    (actualInvitationStatus === "expired" &&
      (!rateLimitInfo?.allowed || cooldownTimeLeft > 0));

  // Determine button text based on status
  const getButtonText = () => {
    if (triggerText) return triggerText;

    switch (actualInvitationStatus) {
      case "pending":
        return "View Status";
      case "expired":
        return "Send New Invitation";
      case "registered":
        return "View Status";
      default:
        return "Send Invitation";
    }
  };
  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          id={triggerId}
          variant={triggerVariant}
          size={iconOnly ? "sm" : triggerSize}
          disabled={isDisabled}
          title={
            actualInvitationStatus === "pending"
              ? "Check invitation status"
              : !rateLimitInfo?.allowed
                ? rateLimitInfo?.reason
                : cooldownTimeLeft > 0
                  ? `Please wait ${formatCooldownTime(cooldownTimeLeft)} before trying again.`
                  : iconOnly
                    ? getButtonText()
                    : undefined
          }
          className={cn(
            isDisabled ? "opacity-60 cursor-not-allowed" : "",
            iconOnly ? "p-2" : "",
            !iconOnly && showIcon ? "gap-2" : "",
            className
          )}
        >
          {isResending ? (
            iconOnly ? (
              <LoadingIndicator />
            ) : (
              <LoadingIndicator text="Sending..." />
            )
          ) : cooldownTimeLeft > 0 && actualInvitationStatus === "expired" ? (
            <>
              {showIcon && (
                <Timer className={cn("w-4 h-4", !iconOnly && "mr-2")} />
              )}
              {!iconOnly &&
                `Available in ${formatCooldownTime(cooldownTimeLeft)}`}
            </>
          ) : (
            <>
              {showIcon &&
                (actualInvitationStatus === "expired" ? (
                  <Send className={cn("w-4 h-4", !iconOnly && "mr-2")} />
                ) : (
                  <Info className={cn("w-4 h-4", !iconOnly && "mr-2")} />
                ))}
              {!iconOnly && getButtonText()}
            </>
          )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="sm:max-w-[450px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
              {actualInvitationStatus === "pending" ? (
                <Clock className="w-5 h-5 text-muted-foreground" />
              ) : actualInvitationStatus === "registered" ? (
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Send className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-xl font-semibold">
                {actualInvitationStatus === "pending"
                  ? "Invitation Status"
                  : actualInvitationStatus === "registered"
                    ? `${config.entityName} Status`
                    : `Send New ${config.entityName} Invitation`}
              </AlertDialogTitle>
            </div>
          </div>

          <div
            className="flex items-center space-x-2 text-sm border-l-4 pl-3 py-1.5 mb-1.5 rounded-sm 
            border-primary/20 bg-muted/30"
          >
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="w-4 h-4" /> {personEmail}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{personName}</span>
            {personRelationship && (
              <>
                {" "}
                · <span className="capitalize">{personRelationship}</span>
              </>
            )}
          </p>
        </AlertDialogHeader>

        <AlertDialogDescription asChild>
          <div className="space-y-4 py-2">
            {invitationStatus === "registered" ? (
              // Status modal for registered/active users
              <div className="space-y-5">
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 p-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Status</h3>
                      <StatusBadge status="active" />
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <CheckCircle className={ICON_SIZES.sm} />
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">{personName}</span> has
                          accepted your request.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm">
                          This {config.entityLabel} has full access to all
                          information they are authorized to see.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/10">
                  <div className="p-4">
                    <h4 className="text-sm font-medium mb-2.5">
                      What you can do:
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-muted h-5 w-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                          →
                        </div>
                        <span>
                          You can remove this {config.entityLabel} at any time
                          without notifying them.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-muted h-5 w-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                          →
                        </div>
                        <span>
                          If they need assistance, direct them to the help
                          center.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : actualInvitationStatus === "pending" ? (
              // Status modal for pending invitations
              <div className="space-y-5">
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 p-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Status</h3>
                      <StatusBadge status={actualInvitationStatus} />
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm">
                          This invitation is still pending.{" "}
                          {personName.split(" ")[0]} has not responded yet.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm">
                          {isInvitationExpired(inviteExpires) ? (
                            <span className="text-destructive font-medium">
                              Invitation has expired
                            </span>
                          ) : (
                            <>
                              Expires in{" "}
                              <span className="font-medium">
                                {formatTimeRemaining(inviteExpires)}
                              </span>{" "}
                              on{" "}
                              <span className="font-medium">
                                {formatDate(inviteExpires)}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border">
                  <div className="p-4">
                    <h4 className="text-sm font-medium mb-2.5">
                      What to do next:
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-muted h-5 w-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                          1
                        </div>
                        <span>
                          Wait for {personName.split(" ")[0]} to check their
                          email
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-muted h-5 w-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                          2
                        </div>
                        <span>Ask them to check their spam folder</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-muted h-5 w-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                          3
                        </div>
                        <span>Send a new invitation after it expires</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              // Resend modal for expired invitations
              <div className="space-y-5">
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 p-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Invitation Status</h3>
                      <StatusBadge status="expired" />
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <AlertCircle className="h-4 w-4 " />
                      </div>
                      <div>
                        <p className="text-sm">
                          The previous invitation has expired and needs to be
                          sent again.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm">
                          Sending a new invitation will create a fresh link
                          valid for 7 days.
                        </p>
                      </div>
                    </div>

                    {rateLimitInfo?.attemptsLeft &&
                      (rateLimitInfo.attemptsLeft.hourly <= 1 ||
                        rateLimitInfo.attemptsLeft.daily <= 2) && (
                        <div className="flex items-start gap-3 pt-1">
                          <div className="mt-0.5">
                            <Clock className="h-4 w-4 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-sm">
                              <strong>
                                {rateLimitInfo.attemptsLeft.daily}
                              </strong>{" "}
                              invitation attempts remaining today.
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {cooldownTimeLeft > 0 && (
                  <div className="border border-border bg-muted/10 rounded-lg p-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <p>
                        You can send another invitation in{" "}
                        <span className="font-medium">
                          {formatCooldownTime(cooldownTimeLeft)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </AlertDialogDescription>

        <AlertDialogFooter className="gap-3 pt-4">
          <AlertDialogCancel
            onClick={() => setIsOpen(false)}
            disabled={isResending}
            className={cn(
              `${actualInvitationStatus === "pending" || actualInvitationStatus === "registered" ? "w-full" : "flex-1"}`
            )}
          >
            {actualInvitationStatus === "pending" ||
            actualInvitationStatus === "registered"
              ? "Close"
              : "Cancel"}
          </AlertDialogCancel>
          {actualInvitationStatus === "expired" && (
            <AlertDialogAction
              onClick={handleResendInvitation}
              disabled={isResending || cooldownTimeLeft > 0}
              className="flex-1"
            >
              {isResending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : cooldownTimeLeft > 0 ? (
                <>
                  <Timer className="w-4 h-4 mr-2" />
                  Wait {formatCooldownTime(cooldownTimeLeft)}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {getButtonText()}
                </>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
