import PublicLayout from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import HelpCenterContent from "@/components/help-center-content";
import CTABanner from "@/components/landing/CtaBanner";

export default function HelpCenter() {
  return (
    <>
      <PublicLayout>
        <PageHeader />
        <div className="max-w-7xl mx-auto my-12 px-20">
          <HelpCenterContent />
        </div>
        <CTABanner />
      </PublicLayout>
    </>
  );
}

function PageHeader() {
  return (
    // TODO: Extract gradient and text styles to a constant file
    <div className="bg-gradient-to-b from-blue-50 to-white py-18 justtify-center text-center px-6 lg:px-0 mx-auto shadow-xs">
      <h1 className="text-4xl font-bold font-display font-playfair italic tracking-tight text-foreground max-w-2xl mx-auto">
        Help Center
      </h1>
      <p className="mx-auto text-sm lg:text-base mt-4 mb-6 font-extralight">
        Everything you need to know about the product and how it works. Can’t
        find an answer?
      </p>
      <Button variant="default" size="lg">
        <MessageCircle />
        Chat with Support
      </Button>
    </div>
  );
}
