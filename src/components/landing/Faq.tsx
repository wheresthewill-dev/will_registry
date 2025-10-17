"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { APP_TITLE } from "@/app/constants/app.config";

const faqData = {
  General: [
    {
      question: `What is ${APP_TITLE} and how does it work?`,
      answer: `${APP_TITLE} is a secure service that helps you register the location of your Will and other important documents. You simply add the details of where your documents are stored, authorize trusted representatives, and they can access this information when needed.`,
    },
    {
      question: "Who can access my Will information?",
      answer:
        "Only you and the representatives you specifically authorize can access your Will information. You have complete control over who has access and can add or remove representatives at any time.",
    },
    {
      question: "Can I add multiple Wills or documents?",
      answer:
        "Yes, you can register multiple Wills and other important documents like powers of attorney, healthcare directives, and insurance policies. Our system allows you to organize all your important legal documents in one secure place.",
    },
    {
      question: "What happens to my account if I pass away?",
      answer:
        "Your authorised representatives will continue to have access to the document location information they need. The account will remain active to serve its intended purpose of helping your loved ones locate important documents.",
    },
    {
      question: "Is this service legally binding?",
      answer: `${APP_TITLE} is a location registry service, not a legal document service. We help people find your actual legal documents. You should always consult with a qualified attorney for legal advice about your Will and estate planning.`,
    },
    {
      question: "How do I get started?",
      answer:
        "Getting started is simple. Create an account, add your Will and document information, authorize your trusted representatives, and you're done. The entire process typically takes less than 10 minutes.",
    },
    {
      question: "What happens if I need to update my Will location?",
      answer:
        "You can easily update your Will location and any other document information at any time through your secure dashboard. Changes are immediately available to your authorised representatives.",
    },
    {
      question: "Can I share access with my lawyer or executor?",
      answer:
        "Yes, you can add your lawyer, executor, or other trusted individuals as authorised representatives at any time.",
    },
    {
      question: "Can my family find my Will if they don’t have an account?",
      answer:
        "No, only people you have explicitly authorised can access your Will’s location. This ensures your privacy and security.",
    },
    {
      question: `What devices can I use to access ${APP_TITLE}`,
      answer: `${APP_TITLE} works on all modern devices, including desktops, tablets, and smartphones. You just need a secure internet connection.`,
    },
  ],
  Security: [
    {
      question: "Is my information secure?",
      answer:
        "Yes, absolutely. We use bank-level AES-256 encryption to protect all your data. We follow a zero-knowledge architecture, meaning we cannot see your private information. Only you and your authorised representatives have access to your data.",
    },
    {
      question: "Do you store copies of my Will or just the location?",
      answer:
        "We only store the location and basic details about your Will, not the actual document itself. This ensures maximum security and privacy while still providing the essential information your representatives need.",
    },
    {
      question: "What if I forget my password?",
      answer:
        "You can reset your password using the 'Forgot Password' link on the login page. For security reasons, this process includes multiple verification steps to ensure your account remains protected.",
    },
    {
      question:
        "What happens if my authorised representative loses their access credentials?",
      answer:
        "They will need to go through a secure verification process to regain access, ensuring your data remains safe.",
    },
    {
      question: "Is my data backed up?",
      answer:
        "Yes, we maintain encrypted backups to prevent data loss in the event of system failure.",
    },
  ],
  Billing: [
    {
      question: "How much does the service cost?",
      answer:
        "We offer different subscription plans to meet various needs. Our basic plan starts at a low monthly fee, and we also offer annual plans with significant savings. Check our pricing page for current rates.",
    },
    {
      question: "Can I cancel my subscription at any time?",
      answer:
        "Yes, you can cancel your subscription at any time. Your data will remain accessible until the end of your current billing period, and we provide options for data export if needed.",
    },
    {
      question: "Do you offer a free trial?",
      answer: `Yes, we offer a free plan so you can try ${APP_TITLE} before committing to a subscription.`,
    },
    {
      question: "Can I switch plans later?",
      answer:
        "Absolutely. You can upgrade or downgrade your subscription at any time from your account settings.",
    },
  ],
};

export default function FAQSection() {
  return (
    <div className="max-w-screen-xl mx-auto lg:flex flex-col items-center">
      <Tabs
        defaultValue="General"
        className="w-full flex flex-col items-center"
      >
        <TabsList className="w-full md:w-1/4 flex flex-row items-center space-x-3 bg-transparent p-0">
          {Object.keys(faqData).map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="text-sm md:text-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-accent data-[state=inactive]:text-muted-foreground justify-center px-3 py-1.5"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Right Accordion */}
        <div className="w-full md:w-3/4 flex flex-col items-center">
          {Object.entries(faqData).map(([category, items]) => (
            <TabsContent
              key={category}
              value={category}
              className="w-full flex flex-col items-center"
            >
              <h3 className="text-md lg:text-xl font-semibold m-6 text-center">
                {category} Questions
              </h3>
              <Accordion
                type="single"
                collapsible
                className="w-full border rounded-lg"
              >
                {items.map((item, id) => (
                  <AccordionItem
                    key={id}
                    value={`item-${id}`}
                    className="px-4 hover:bg-accent transition-colors duration-200 border-b last:border-b-0 first:rounded-t-lg last:rounded-b-lg md:text-lg text-sm"
                  >
                    <AccordionTrigger className="text-left md:text-lg font-medium py-5">
                      {item.question}
                    </AccordionTrigger>
                    {/* TODO: put accordion font color in constant file */}
                    <AccordionContent className="text-gray-600 pb-4 text-left leading-relaxed md:text-base">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
