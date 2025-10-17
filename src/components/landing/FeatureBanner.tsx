import React from "react";
import FeatureCard from "./FeatureCard";
import { Card } from "../ui/card";
import { FolderRoot, Timer, Lightbulb } from "lucide-react";

export default function FeatureBanner() {
  return (
    <div className="flex items-center justify-center">
      <div className="m-6 sm:m-12 lg:m-16">
        <Card className="p-10 sm:py-16 lg:py-20 px-6 sm:px-12 lg:px-18 xl:px-42 shadow-xl">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div>
              <h1 className="text-xl mt-5 sm:text-3xl font-playfair font-semibold italic text-center tracking-wide lg:text-left">
                Make Your Will Easy to Find
              </h1>
            </div>
            <div className="p-4 font-light text-justify text-sm md:text-md lg:text-lg">
              <p className="my-4">
                Life doesn’t come with guarantees — and finding important
                documents shouldn’t be a guessing game.
              </p>
              <p>
                Whether you live abroad, travel often, or just want to be
                prepared, registering the location of your Will helps your loved
                ones avoid delays, confusion, and legal issues after you're
                gone.
              </p>
            </div>
          </div>
          <div className="mx-auto gap-2 text-center grid md:grid-cols-3 lg:gap-15 lg:mt-5">
            {/* TODO: Make feature details static constants and map it to the component */}
            <FeatureCard
              icon={<FolderRoot />}
              title={"One place for your Will"}
              description={"Know exactly where the Will is stored"}
            />
            <FeatureCard
              icon={<Timer />}
              title={"Avoid Delays"}
              description={"Prevent estate disputes and probate issues"}
            />
            <FeatureCard
              icon={<Lightbulb />}
              title={"Peace of Mind"}
              description={"Loved ones are informed when it matters"}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
