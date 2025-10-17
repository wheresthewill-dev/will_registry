import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CountrySelect } from "@/components/country-select";
import { PhoneInput } from "@/components/phone-input";
import { PasswordInput } from "@/components/custom/password-input";
import { DatePicker } from "@/components/ui/date-picker";

export const renderField = (field: any, f: any) => {
  if (field.type === "select") {
    return (
      <CountrySelect
        id={field.name}
        value={f.value as string}
        onChange={f.onChange}
      />
    );
  }

  if (field.type === "phone") {
    return (
      <PhoneInput
        value={f.value as string}
        onChange={(value) => f.onChange(value)}
      />
    );
  }
  if (field.type === "password") {
    return (
      <PasswordInput
        id={field.name}
        value={f.value as string}
        onChange={(e) => f.onChange(e.target.value)}
      />
    );
  }
  if (field.type === "date") {
    return (
      <DatePicker
        value={f.value as string}
        onChange={(value) => f.onChange(value)}
        placeholder={field.placeholder || "DD/MM/YYYY"}
        disabled={field.disabled}
        className={field.className}
        format={field.dateFormat || "dd/MM/yyyy"} // Display format (European)
        outputFormat="yyyy-MM-dd" // Store format (ISO)
      />
    );
  }
  return (
    <Input type={field.type || "text"} id={field.name} {...f} value={f.value} />
  );
};

export const renderFields = (fields: any[], control: any) =>
  fields.map((field) => (
    <FormField
      key={field.name}
      control={control}
      name={field.name}
      render={({ field: f }) => (
        <FormItem className="flex flex-col items-start">
          <FormLabel htmlFor={field.name} className="text-xs md:text-sm">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </FormLabel>
          <FormControl className="text-xs md:text-sm">
            {renderField(field, f)}
          </FormControl>
          {field.description && (
            <FormDescription className="text-xs md:text-sm">
              {field.description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  ));
