import { Button } from "../ui/button";

export default function CTABanner() {
  return (
    <div className="px-6">
      <div className="dark:border relative overflow-hidden my-20 w-full dark bg-background text-foreground max-w-screen-xl mx-auto rounded-2xl py-10 md:py-16 px-6 md:px-14">
        <div className="relative z-0 flex flex-col gap-3">
          <h3 className="text-2xl text-center md:text-4xl md:text-left   font-semibold font-playfair italic">
            Ready to secure your legacy?
          </h3>
          <p className="mt-2 text-center md:text-lg lg:text-left font-light leading-7">
            Protect your story. Make sure your Will’s location is safe, secure,
            and always accessible to the people who matter most.
          </p>
        </div>
        <div className="relative z-0 mt-14 flex flex-col sm:flex-row gap-4">
          <Button size="lg">Get Started</Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
}
