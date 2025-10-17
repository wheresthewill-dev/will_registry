import React, { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import StatusBadge, { StatusType } from "@/components/ui/status-badge";

interface InfoItemProps {
  /** Icon to display next to the info item */
  icon: ReactNode;
  /** Content to display in the info item */
  children: ReactNode;
  /** Optional text color class */
  textColorClass?: string;
}

function InfoItem({
  icon,
  children,
  textColorClass = "text-foreground/80",
}: InfoItemProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="text-primary/70">{icon}</div>
      <span className={textColorClass}>{children}</span>
    </div>
  );
}

interface PersonCardProps {
  /** The name of the person */
  name: string;
  /** User initials to display in avatar */
  initials: string;
  /** Optional avatar color class */
  avatarColorClass?: string;
  /** Status of the card (active, pending, or expired) */
  status?: StatusType;
  /** Content to display in the card body */
  children: ReactNode;
  /** Content to display in the footer */
  footerContent: ReactNode;
  /** Additional class names to apply to the card */
  className?: string;
}

export function PersonCard({
  name,
  initials,
  avatarColorClass = "bg-primary/90",
  status,
  children,
  footerContent,
  className,
}: PersonCardProps) {
  return (
    <Card
      className={cn(
        "shadow-sm hover:shadow transition-all overflow-hidden border border-border relative",
        className
      )}
    >
      {/* Card Header with user info */}
      <CardHeader className="px-5 pb-5 border-b bg-background">
        <div className="flex items-center gap-3.5">
          <Avatar className="h-11 w-11 border border-muted shadow-sm">
            <AvatarFallback
              className={cn("text-primary-foreground", avatarColorClass)}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 justify-between mb-1.5">
              <h4 className="font-medium truncate text-base">{name}</h4>
            </div>
            {status && (
              <div className="flex items-center gap-2">
                <StatusBadge status={status} />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Card Body */}
      <CardContent className="px-5 py-4 space-y-3 bg-muted/5">
        {children}
      </CardContent>

      {/* Card Footer */}
      <CardFooter className="p-3 border-t flex justify-center gap-2">
        {footerContent}
      </CardFooter>
    </Card>
  );
}

// Export both the PersonCard and the InfoItem component
export { InfoItem };
export default PersonCard;
