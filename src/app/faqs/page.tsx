import PublicLayout from "@/components/public-layout";
import { ChevronDown, HelpCircle } from "lucide-react";
import { APP_TITLE } from "../constants/app.config";

export default function FAQsPage() {
  const faqs = [
    {
      question: `What is ${APP_TITLE} and how does it work?`,
      answer: `${APP_TITLE} is a secure service that helps you register the location of your Will and other important documents. You simply add the details of where your documents are stored, authorize trusted representatives, and they can access this information when needed.`,
    },
    {
      question: "Is my information secure?",
      answer:
        "Yes, absolutely. We use bank-level AES-256 encryption to protect all your data. We follow a zero-knowledge architecture, meaning we cannot see your private information. Only you and your authorised representatives have access to your data.",
    },
    {
      question: "Who can access my Will information?",
      answer:
        "Only you and the representatives you specifically authorize can access your Will information. You have complete control over who has access and can add or remove representatives at any time.",
    },
    {
      question: "What happens if I need to update my Will location?",
      answer:
        "You can easily update your Will location and any other document information at any time through your secure dashboard. Changes are immediately available to your authorised representatives.",
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
      question: "Can I add multiple Wills or documents?",
      answer:
        "Yes, you can register multiple Wills and other important documents like powers of attorney, healthcare directives, and insurance policies. Our system allows you to organize all your important legal documents in one secure place.",
    },
    {
      question: "How much does the service cost?",
      answer:
        "We offer different subscription plans to meet various needs. Our basic plan starts at a low monthly fee, and we also offer annual plans with significant savings. Check our pricing page for current rates.",
    },
    {
      question: "What happens to my account if I pass away?",
      answer:
        "Your authorised representatives will continue to have access to the document location information they need. The account will remain active to serve its intended purpose of helping your loved ones locate important documents.",
    },
    {
      question: "Can I cancel my subscription at any time?",
      answer:
        "Yes, you can cancel your subscription at any time. Your data will remain accessible until the end of your current billing period, and we provide options for data export if needed.",
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
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-purple-50 to-white py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <HelpCircle className="h-16 w-16 text-purple-600 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about our Will location registry
              service. Can't find what you're looking for? Contact our support
              team.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <summary className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  </summary>
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Help Section */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-gray-600 mb-8">
              Our support team is here to help you with any questions or
              concerns.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2">Email Support</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Get detailed help via email
                </p>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  support@{APP_TITLE}.com
                </button>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2">Live Chat</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Chat with us in real-time
                </p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                  Start Chat
                </button>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2">Phone Support</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Speak with our team directly
                </p>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  1-800-WILL-LOC
                </button>
              </div>
            </div>

            <div className="bg-blue-600 rounded-lg p-8 text-white">
              <h3 className="text-xl font-semibold mb-4">
                Ready to Get Started?
              </h3>
              <p className="mb-6">
                Join thousands of families who have secured their legacy with
                {APP_TITLE}.
              </p>
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                Create Your Account
              </button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
