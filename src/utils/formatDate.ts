// Helper function for European date format
export const formatDate = (dateString: string | null) => {
  if (!dateString) return "Unknown date";
  return new Date(dateString).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
};
