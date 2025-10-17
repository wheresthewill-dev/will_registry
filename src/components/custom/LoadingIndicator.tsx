"use client";
import React from "react";
import { Loader2Icon } from "lucide-react";

interface LoadingIndicatorProps {
  text?: string; // Optional prop for custom text
}

export function LoadingIndicator({
  text,
}: LoadingIndicatorProps): React.ReactNode {
  return (
    <>
      <Loader2Icon className="mr-2 animate-spin" />
      {text}
    </>
  );
}
