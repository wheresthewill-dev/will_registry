import { ICON_SIZES, ICON_STROKES } from "@/app/constants/icons";
import { cn } from "@/lib/utils";
import React from "react";

interface FeatureCardProps {
  icon: React.ReactElement<{ className?: string }>;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  const styledIcon = React.cloneElement(icon, {
    className: cn(
      (icon.props as { className?: string }).className,
      ICON_SIZES.xl,
      ICON_STROKES.sm
    ),
  });

  return (
    <div className="max-w-xs md:max-w-lg p-2 lg:p-6">
      <div className="my-5">{styledIcon}</div>
      <div>
        <h2 className="text-base lg:text-xl font-medium text-left">{title}</h2>
        <p className="text-sm text-left font-light lg:text-base mt-5">
          {description}
        </p>
      </div>
    </div>
  );
}
