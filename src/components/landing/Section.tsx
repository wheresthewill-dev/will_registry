import React, { ReactElement } from "react";

interface SectionProps {
  title: string;
  description: string;
  content: ReactElement;
  useAccentBackground?: boolean;
  id: string;
}

export default function Section({
  title,
  description,
  useAccentBackground = false,
  content,
  id,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`items-center justify-center text-center p-8 md:px-20 md:py-15 ${
        useAccentBackground ? "bg-secondary" : "bg-white"
      }`}
    >
      <div>
        <h1 className="text-2xl lg:text-4xl font-bold italic font-playfair leading-[52px] tracking-[-0.003em]">
          {title}
        </h1>
      </div>
      <div className="text-sm lg:text-base mt-4 mb-10 font-light">
        <p>{description}</p>
      </div>
      <div>{content}</div>
    </section>
  );
}
