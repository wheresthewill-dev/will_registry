import React from "react";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

interface RepresentativeNotifiedProps {
  willOwnerFirstname: string;
}

export const RepresentativeNotified = ({
  willOwnerFirstname,
}: RepresentativeNotifiedProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className="text-sm text-muted-foreground italic">
            Authorised Representatives notified
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Representatives have been notified of {willOwnerFirstname}'s passing.
          No action required.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RepresentativeNotified;
