import { SUBSCRIPTION_PLANS } from "../data/subscription-data";

export function generateSubscriptions() {
  return Object.values(SUBSCRIPTION_PLANS).map((subscription) => {
    const features = [];

    if ("arLimit" in subscription) {
      features.push(`${subscription.arLimit} Authorised Representative`);
    }

    if ("ecLimit" in subscription) {
      features.push(`${subscription.ecLimit} Emergency Contact`);
    }

    if (subscription.features?.length) {
      features.push(...subscription.features);
    }

    if (subscription.billingPeriod.includes("year")) {
      // handling dynamic pricing text
      const pricePer = subscription.price + 1;
      subscription.buttonText = `Subscribe for $${pricePer}/${subscription.billingPeriod}`;
    }

    return {
      name: subscription.name,
      price: subscription.price,
      billingPeriod: subscription.billingPeriod,
      description: subscription.description,
      features,
      buttonText: subscription.buttonText,
    };
  });
}
