//TODO: Remove buttonText prop
export const SUBSCRIPTION_PLANS = {
  bronze: {
    name: "Bronze",
    price: 0,
    billingPeriod: "Free",
    arLimit: 1,
    ecLimit: 1,
    features: ["Secure and private access"],
    buttonText: "Start for Free",
    description: "Safe and simple will storage for everyone.",
  },
  silver: {
    name: "Silver",
    price: 29,
    billingPeriod: "per year",
    arLimit: 12,
    ecLimit: 6,
    features: ["Complete alert system"],
    buttonText: "Subscribe for $30/year",
    description: "More contacts, more peace of mind yearly.",
  },
  gold: {
    name: "Gold",
    price: 99.99,
    billingPeriod: "one-time (5 years)",
    features: [
      "All Silver features",
      "5-year access",
      "Free copy of Janet's book",
    ],
    buttonText: "Get 5 Years for $99.99",
    description: "5-year access with trusted perks included.",
  },
  platinum: {
    name: "Platinum",
    price: 199.99,
    billingPeriod: "one-time (10 years)",
    features: [
      "All Gold features",
      "Free will review",
    ],
    buttonText: "Get 10 Years for $199.99",
    description: "10-year plan with premium protection for your will.",
  },
};
