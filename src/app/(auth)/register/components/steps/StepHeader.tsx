import React from "react";

interface StepHeaderProps {
  title: string;
  description: React.ReactNode;
}

export default function StepHeader({ title, description }: StepHeaderProps) {
  return (
    <div className="text-center my-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{title}</h1>
      <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-2">
        {description}
      </p>
    </div>
  );
}
