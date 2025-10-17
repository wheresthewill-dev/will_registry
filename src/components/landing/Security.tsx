import React from "react";
import { ShieldCheck, Lock, EyeOff, Share2 } from "lucide-react";
import { ICON_SIZES } from "@/app/constants/icons";
import { Button } from "../ui/button";

const features = [
  {
    title: "Your Data, Your Control",
    icon: Lock,
    description:
      "Think of it as your personal digital safe—only you hold the keys, and no one else can peek inside.",
  },
  {
    title: "Shared Only With People You Trust",
    icon: Share2,
    description:
      "Even we can’t view your details. Access stays between you and the loved ones you choose.",
  },
  {
    title: "Always Watched, Always Protected",
    icon: ShieldCheck,
    description:
      "Our secure system works around the clock to keep your important information safe from prying eyes.",
  },
];

export default function Security() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-screen-xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col border rounded-xl py-6 px-5 shadow-sm bg-white hover:shadow-md transition-shadow duration-200 text-center"
            >
              <div className="m-8 h-15 w-15 flex items-center justify-center mx-auto bg-muted rounded-full">
                <feature.icon className={ICON_SIZES.xl} />
              </div>
              <span className="text-lg font-semibold">{feature.title}</span>
              <p className="mt-4 text-foreground/80 text-[15px]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="mt-10 py-10 px-8 rounded-lg border bg-primary shadow-xs text-center max-w-screen-xl mx-auto">
          <h2 className="text-xl font-semibold text-white">
            Want to learn more about how we keep your data secure?
          </h2>
          <p className="mt-2 text-base text-white/80">
            Visit our Security page for detailed information about our
            encryption, infrastructure, and privacy practices.
          </p>
          <Button variant="secondary" className="mt-4" size="lg">
            <a href="/security">Learn More</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
