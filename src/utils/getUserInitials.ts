export const getUserInitials = (
  firstName: string | null,
  lastName: string | null
) => {
  const first = firstName || "";
  const last = lastName || "";
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
};
