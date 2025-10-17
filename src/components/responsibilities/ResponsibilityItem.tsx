import { ICON_SIZES } from "@/app/constants/icons";
import { Check } from "lucide-react";
import React from "react";

interface ResponsibilityItemProps {
  text: string;
}

export const ResponsibilityItem = ({ text }: ResponsibilityItemProps) => (
  <li className="flex items-start gap-2">
    <div className="mt-0.5">
      <Check className={ICON_SIZES.sm} />
    </div>
    <span className="text-sm">{text}</span>
  </li>
);

export default ResponsibilityItem;
