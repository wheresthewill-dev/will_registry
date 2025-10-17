export type FormField = {
  name: string;
  label: string;
  type?: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
};

export type SubscriptionTier = {
  name: string;
  price: number;
  duration: number;
  description: string;
};

export const USER_LOGIN_DETAILS: readonly FormField[] = [
  { name: "email", label: "Email", type: "email", required: true },
  { name: "password", label: "Password", type: "password", required: true },
];

export const PERSONAL_DETAILS: readonly FormField[] = [
  { name: "firstName", label: "First Name", required: true },
  { name: "middleName", label: "Middle Name", required: false },
  { name: "lastName", label: "Last Name", required: true },
  {
    name: "birthDate",
    label: "Date of Birth",
    type: "date",
    required: true,
    placeholder: "DD/MM/YYYY",
  },
  { name: "birthTown", label: "Suburb or Town of Birth", required: true },
  {
    name: "birthCountry",
    label: "Country of Birth",
    type: "select",
    required: true,
  },
];

export const ADDRESS_DETAILS: readonly FormField[] = [
  { name: "addressLine", label: "Street Address" },
  { name: "addressState", label: "State" },
  { name: "addressTown", label: "Suburb or Town" },
  { name: "addressPostcode", label: "Postcode" },
  { name: "addressCountry", label: "Country", type: "select" },
];

export const PHONE_DETAILS: readonly FormField[] = [
  { name: "mobilePhone", label: "Mobile Phone", type: "phone" },
  { name: "homePhone", label: "Home Phone", type: "phone" },
  { name: "workPhone", label: "Work Phone", type: "phone" },
];

export const LOGIN_DETAILS: readonly FormField[] = [
  {
    name: "email",
    label: "Email",
    type: "email",
    description:
      "We'll send account updates here. Use a valid address (e.g., johndoe@gmail.com).",
    required: true,
  },
  {
    name: "username",
    label: "Username",
    description: "Create a unique username, at least 6 characters.",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    description:
      "Use 6+ characters, with at least one capital letter and one symbol (e.g., @, #, &).",
    required: true,
  },
  {
    name: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    description: "Re-enter your password to make sure it matches.",
    required: true,
  },
];

export const SUBSCRIPTION_TIERS: readonly SubscriptionTier[] = [
  { name: "bronze", price: 0, duration: 0, description: "" },
  { name: "silver", price: 30, duration: 1, description: "" },
  { name: "gold", price: 100, duration: 5, description: "" },
  { name: "platinum", price: 200, duration: 10, description: "" },
];

export const WILL_DETAILS: readonly FormField[] = [
  {
    name: "document_label",
    label: "Will Title",
    type: "text",
    description: "Enter a descriptive title for your will document",
    placeholder: "e.g., My Last Will and Testament 2025",
  },
  {
    name: "description",
    label: "Description/Location",
    type: "textarea",
    description:
      "Describe your will document, its purpose, and location if applicable",
    placeholder:
      "Describe the contents of your will, its purpose, and where the original document is stored. Include any important details about beneficiaries, assets, or special instructions...",
  },
  {
    name: "will_document",
    label: "File Attachment (Optional)",
    type: "file",
    description: "Upload your document/s.",
  },
];

export const EDIT_WILL_DETAILS: readonly FormField[] = [
  {
    name: "document_label",
    label: "Will Title",
    type: "text",
    description: "Update the title of your will document.",
    placeholder: "e.g., My Last Will and Testament 2025",
  },
  {
    name: "description",
    label: "Description / Location",
    type: "textarea",
    description:
      "Revise the details, purpose, and physical or digital location of your will document.",
    placeholder:
      "Describe the contents, purpose, and where the original document is stored. Include details about beneficiaries, assets, or special instructions.",
  },
  {
    name: "will_document",
    label: "File Attachment",
    type: "file",
    description: "Upload or replace your document/s.",
  },
];
