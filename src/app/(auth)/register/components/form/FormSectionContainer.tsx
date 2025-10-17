import React from "react";
import { renderFields } from "./FormFieldRenderer";

type FormSectionProps = {
  fields?: any[];
  control: any;
  title?: string;
  description?: React.ReactNode;
  gridColumns: string;
  children?: React.ReactNode;
};

export default function FormSection({
  title,
  description,
  fields = [],
  control,
  gridColumns,
  children,
}: FormSectionProps) {
  return (
    <>
      <div className="my-5 justify-start text-start space-y-2">
        <div className="font-medium text-sm md:text-xl">
          {title && (
            <span>
              {title}
              {["Phone Details", "Privacy", "Declaration"].includes(title) && (
                <span className="text-destructive"> *</span>
              )}
            </span>
          )}
        </div>
        <div className="font-light text-xs lg:text-sm">{description}</div>
      </div>
      <div className={`grid grid-cols-1 ${gridColumns} gap-4`}>
        {renderFields(fields, control)}
        {children}
      </div>
    </>
  );
}
