import React from "react";
import Link from "next/link";
import { ErrorIllustration } from "./ErrorIllustration";
import { Button } from "../ui/button";

// Extract colors into their own constant for better maintainability
const COLORS = {
  primary: {
    main: "bg-accent-foreground",
    hover: "hover:bg-accent-foreground-700",
    text: "text-white",
  },
  secondary: {
    main: "bg-white",
    hover: "hover:bg-gray-50",
    border: "border-gray-300",
    text: "text-gray-700",
  },
  text: {
    heading: "text-gray-900",
    body: "text-gray-500",
  },
  border: {
    transparent: "border-transparent",
  },
};

// Extract hardcoded styles into constants that reference the colors
const STYLES = {
  container: {
    wrapper: "min-h-screen flex items-center justify-center px-4 py-12",
    content: "max-w-md w-full text-center",
  },
  typography: {
    title: `mt-6 text-3xl font-extrabold font-playfair tracking-tight sm:text-4xl`,
    description: `mt-3 text-base ${COLORS.text.body} sm:mt-5 sm:text-lg`,
  },
  actions: {
    container: "mt-8 flex flex-col sm:flex-row gap-3 justify-center",
  },
};

interface ErrorPageProps {
  title: string;
  description: string;
  illustrationType: "notFound" | "serverError" | "expired" | "unauthorized";
  actionText?: string;
  actionHref?: string;
  secondaryActionText?: string;
  secondaryActionHref?: string;
  children?: React.ReactNode;
}

export function ErrorPage({
  title,
  description,
  illustrationType,
  actionText = "Go to Home",
  actionHref = "/",
  secondaryActionText,
  secondaryActionHref,
  children,
}: ErrorPageProps) {
  return (
    <div className={STYLES.container.wrapper}>
      <div className={STYLES.container.content}>
        <ErrorIllustration type={illustrationType} />

        <h1 className={STYLES.typography.title}>{title}</h1>

        <p className={STYLES.typography.description}>{description}</p>

        {children}

        <div className={STYLES.actions.container}>
          <Button>
            <Link href={actionHref}>{actionText}</Link>
          </Button>

          {secondaryActionText && secondaryActionHref && (
            <Button>
              <Link href={secondaryActionHref}>{secondaryActionText}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
