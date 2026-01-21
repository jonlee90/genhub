"use client";

import { m as motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step.id} className="flex-1 flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <motion.div
                className={cn(
                  "relative flex items-center justify-center w-12 h-12 rounded-full border-4 transition-colors duration-300",
                  isCompleted && "bg-construction-blue border-construction-blue",
                  isCurrent && "bg-white dark:bg-gray-900 border-construction-blue",
                  !isCompleted && !isCurrent && "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                )}
                whileHover={{ scale: 1.05 }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Check className="w-6 h-6 text-white" />
                  </motion.div>
                ) : (
                  <div className={cn(
                    "transition-colors",
                    isCurrent ? "text-construction-blue" : "text-gray-400 dark:text-gray-600"
                  )}>
                    {step.icon}
                  </div>
                )}

                {/* Glow effect for current step */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-construction-blue/20 blur-lg"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </motion.div>

              {/* Step label */}
              <span className={cn(
                "mt-2 text-xs font-bold transition-colors text-center max-w-[80px]",
                isCurrent ? "text-construction-blue" : "text-gray-500 dark:text-gray-400"
              )}>
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-4 relative">
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full" />
                {isCompleted && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-construction-blue to-construction-accent rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{ transformOrigin: "left" }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
