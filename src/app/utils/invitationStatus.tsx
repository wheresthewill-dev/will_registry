// Helper function to determine invitation status
export const getInvitationStatus = (
  status: string,
  inviteExpires?: string
): "pending" | "expired" | "active" => {
  // If already registered/active
  if (status === "registered" || status === "active") {
    return "active";
  }

  // If pending, check if expired
  if (status === "pending" && inviteExpires) {
    const expiryDate = new Date(inviteExpires);
    const now = new Date();

    if (expiryDate < now) {
      return "expired";
    }
    return "pending";
  }

  // Default fallback
  if (inviteExpires) {
    const expiryDate = new Date(inviteExpires);
    const now = new Date();
    return expiryDate < now ? "expired" : "pending";
  }

  return "pending";
};
