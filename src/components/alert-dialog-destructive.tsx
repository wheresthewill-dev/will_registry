import { ICON_SIZES } from "@/app/constants/icons";
import { VARIANT_STYLES } from "@/app/constants/ui-variants";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

interface AlertDialogDestructiveProps {
  icon: React.ReactElement<{ className?: string }>;
  triggerText?: string;
  triggerId?: string;
  title: string;
  description: React.ReactNode;
  size: "default" | "sm" | "lg" | "icon";
  cancelText?: string;
  confirmText?: string;
  onClick: () => void;
  iconOnly?: boolean;
  className?: string;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "link"
    | "destructive"
    | "secondary";
}

export default function AlertDialogDestructive({
  icon,
  triggerText,
  triggerId,
  title,
  description,
  size,
  cancelText = "Cancel",
  confirmText = "Proceed",
  onClick,
  iconOnly = false,
  variant = "destructive",
  className,
}: AlertDialogDestructiveProps) {
  const styledIcon = React.cloneElement(icon, {
    className: cn(
      (icon.props as { className?: string }).className,
      ICON_SIZES.xl,
      variant
        ? variant === "destructive"
          ? "text-destructive"
          : variant === "default"
            ? "text-primary"
            : variant === "secondary"
              ? "text-secondary-foreground"
              : variant === "ghost"
                ? "text-destructive"
                : variant === "outline"
                  ? "text-foreground"
                  : "text-foreground"
        : "text-destructive"
    ),
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          id={triggerId}
          variant={variant}
          className={cn(className, iconOnly ? "" : "gap-2")}
          size={iconOnly ? "sm" : size}
        >
          {styledIcon}
          {!iconOnly && triggerText}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="items-center">
          <AlertDialogTitle>
            <div className="mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              {styledIcon}
            </div>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[15px] text-center mb-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="border-t -mx-6 -mb-6 px-6 py-5">
          <AlertDialogCancel className="mr-auto">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={onClick}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
