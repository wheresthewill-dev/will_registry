"use client";

import PublicLayout from "@/components/public-layout";
import Hero from "@/components/landing/Hero";
import Section from "@/components/landing/Section";
import HowItWorks from "@/components/landing/HowItWorks";
import Plans from "@/components/landing/Plans";
import ContactUs from "@/components/landing/ContactUs";
import ContactUsWithConfig from "@/components/landing/ContactUsWithConfig";
import FAQ from "@/components/landing/Faq";
import Security from "@/components/landing/Security";
import CTABanner from "@/components/landing/CtaBanner";
import FeatureBanner from "@/components/landing/FeatureBanner";
import { useAppConfig } from "./utils/repo_services/hooks/app_config";

// TODO: Refactor this to use a static constant for the sections instead of hardcoding them here
const LANDING_PAGE_SECTIONS = [
  {
    id: "how-it-works",
    title: "Secure your Will’s location in minutes",
    description:
      "Add your details, authorize people you trust, and stay in control at all times.",
    content: <HowItWorks />,
  },
  {
    id: "security",
    title: "Security That Lasts",
    description:
      "From storage to access, every layer of your information is secured with enterprise-grade encryption. Rest easy knowing your legacy is protected.",
    content: <Security />,
  },
  {
    id: "plans",
    title: "Your Legacy, Your Way",
    description:
      "Choose a plan that aligns with your personal or family requirements.",
    content: <Plans />,
  },
  {
    id: "faq",
    title: "Frequently Asked Questions",
    description:
      "Find answers to common questions about our Will location registry service.",
    content: <FAQ />,
  },
  {
    id: "contact-us",
    title: "Chat to our friendly team",
    description:
      "We'd love to hear from you. Please fill out this form or shoot us an email.",
    content: <ContactUs />,
  },
];

export default function Home() {
  // Fetch app config using server function
  const { data: appConfig } = useAppConfig();
  console.log("App Config:", appConfig);

  return (
    <>
      <PublicLayout>
        <div>
          <Hero />
          <FeatureBanner />
          {LANDING_PAGE_SECTIONS.map((section) => {
            // If this is the contact-us section and we have app config data, use ContactUsWithConfig
            if (section.id === "contact-us" && appConfig) {
              return (
                <Section
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  description={section.description}
                  content={<ContactUsWithConfig appConfig={appConfig} />}
                />
              );
            }
            // Otherwise use the default section content
            return (
              <Section
                key={section.id}
                id={section.id}
                title={section.title}
                description={section.description}
                content={section.content}
              />
            );
          })}
          <CTABanner />
        </div>
      </PublicLayout>
    </>
  );
}
