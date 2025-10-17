import React from "react";
import { APP_LOGO_ICON, APP_TITLE } from "@/app/constants/app.config";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface BrandProps {
  className?: string;
  showLogo?: boolean;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export default function Brand({
  className,
  showLogo,
  href,
  onClick,
}: BrandProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <a
      href={href || "/"}
      onClick={handleClick}
      className="flex flex-row items-center gap-2 cursor-pointer"
    >
      {showLogo && (
        <Image src={APP_LOGO_ICON} alt="logo" width={36} height={36} />
      )}
      <div className={cn("font-playfair font-semibold", className)}>
        {APP_TITLE}
      </div>
    </a>
  );
}
