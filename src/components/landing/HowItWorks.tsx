import React from "react";
import { Heart, Users, UserPlus, Lock } from "lucide-react";
import { ICON_SIZES } from "@/app/constants/icons";

const steps = [
  {
    title: "Sign Up",
    icon: UserPlus,
    description:
      "Create your account in just a few easy steps. No tech skills needed!",
  },
  {
    title: "Securely add your Will info",
    icon: Lock,
    description:
      "Enter where your will is kept—safe and private, only for you and your trusted people.",
  },
  {
    title: "Choose your trusted contacts",
    icon: Users,
    description:
      "Pick family or close friends who will be notified when needed.",
  },
  {
    title: "Relax with Peace of Mind",
    icon: Heart,
    description:
      "Rest easy knowing your loved ones will always know where to find your important documents.",
  },
];

const HowItWorks = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="max-w-screen-xl w-full py-12">
        <div className="w-full mx-auto grid md:grid-cols-2 gap-16">
          <div className="text-left">
            {steps.map(({ title, description, icon: Icon }, index) => (
              <div
                key={index}
                className="py-4 flex gap-6 md:space-y-8 items-start"
              >
                <div className="flex-shrink-0 border-2 rounded-full p-3">
                  <Icon className={ICON_SIZES.md} />
                </div>

                <div className="flex flex-col w-full">
                  <div className="text-lg font-semibold">{title}</div>
                  <div className="text-base leading-relaxed text-muted-foreground mt-2">
                    {description}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* TODO: Placement holder; to add screenshot of dashboard */}
          <div className="hidden md:block w-full h-full bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
