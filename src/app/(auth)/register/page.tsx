"use client";

import React, { useState, useEffect } from "react";
import { STEP_COMPONENTS } from "./components/steps";
import { useRegistrationStore } from "@/stores/formStore";
import { Toaster } from "sonner";
import RegistrationStepper from "./components/form/RegistrationStepper";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { StepId } from "./components/steps";

export default function RegistrationPage() {
  const { currentStep } = useRegistrationStore();
  const [previousStep, setPreviousStep] = useState<StepId>(currentStep);

  // Get the current step component
  const StepComponent = STEP_COMPONENTS[currentStep];

  // Track previous step
  useEffect(() => {
    if (currentStep !== previousStep) {
      setPreviousStep(currentStep);
    }
  }, [currentStep, previousStep]);

  // Simple fade transition for elderly users
  const pageVariants: Variants = {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5, // Slower, gentler transition
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <>
      <RegistrationStepper />
      <div className="max-w-sm md:max-w-7xl mx-auto mb-12">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>
        <Toaster position="bottom-center" richColors />
      </div>
    </>
  );
}
