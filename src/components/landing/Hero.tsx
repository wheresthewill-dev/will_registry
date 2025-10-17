import { LANDING_PAGE_IMAGE_PATHS } from "@/app/constants/image-paths";
import { Button } from "@/components/ui/button";
import React from "react";
import Image from "next/image";

export default function Hero() {
  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden">
      <div className="max-w-screen-xl w-full mx-auto grid lg:grid-cols-2 gap-12 px-6 py-12 lg:py-0">
        <div className="my-auto flex flex-col items-center lg:items-start text-center lg:text-left">
          <h1 className="mt-6 max-w-[17ch] text-4xl md:text-5xl lg:text-[2.75rem] xl:text-5xl font-bold font-playfair  italic">
            Is your legacy secure?
          </h1>
          <p className="mt-6 max-w-[60ch] text-md md:text-lg font-light text-center md:text-left">
            Store the location of your Will and other important documents —
            ensuring peace of mind for you, and convenience for your loved ones.
          </p>
          <div className="mt-12 flex items-center gap-4 justify-center md:justify-start">
            <Button size="lg">Get Started</Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
        <div className="relative w-full aspect-video lg:aspect-auto lg:w-[1000px] lg:h-[calc(100vh-4rem)] bg-accent rounded-xl">
          <Image
            src={LANDING_PAGE_IMAGE_PATHS.heroImage}
            alt="hero-image"
            fill
            className="object-cover rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
