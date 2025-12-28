# Task 0005: Enhance CreateProjectForm with Multi-Step & Text Generate Effect

**Priority**: MEDIUM
**Estimated Time**: 3-4 hours
**Component**: `components/projects/CreateProjectForm.tsx`

## Objective
Transform project creation form into a guided multi-step experience with Aceternity UI text generate effects, smooth step transitions, and construction-themed progress indicator.

## Current State
- Single-page form with all fields visible
- Basic project type selection cards
- Template preview sidebar
- Simple form validation

## Target State (Aceternity UI)
- **Multi-Step Flow**: 4 steps (Type → Details → Location → Timeline)
- **Text Generate Effect**: Animated instructions for each step
- **Progress Indicator**: Construction-themed stepper with icons
- **Smooth Transitions**: Slide animations between steps
- **Enhanced Type Selection**: 3D card effect for project types
- **Sidebar Updates**: Dynamic template preview per step

## Implementation Steps

### 1. Create Text Generate Effect Component

**File**: `components/ui/aceternity/text-generate-effect.tsx`

```typescript
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  duration?: number;
}

export function TextGenerateEffect({
  words,
  className,
  duration = 0.5,
}: TextGenerateEffectProps) {
  const wordsArray = words.split(" ");

  return (
    <div className={cn("space-y-2", className)}>
      {wordsArray.map((word, idx) => (
        <motion.span
          key={word + idx}
          className="inline-block mr-1"
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{
            delay: idx * 0.05,
            duration: duration,
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}
```

### 2. Create Multi-Step Stepper Component

**File**: `components/ui/aceternity/stepper.tsx`

```typescript
"use client";

import { motion } from "framer-motion";
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
                  isCurrent && "bg-white border-construction-blue",
                  !isCompleted && !isCurrent && "bg-white border-gray-300"
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
                    isCurrent ? "text-construction-blue" : "text-gray-400"
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
                "mt-2 text-xs font-medium transition-colors",
                isCurrent ? "text-construction-blue" : "text-gray-500"
              )}>
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-4 relative">
                <div className="absolute inset-0 bg-gray-200 rounded-full" />
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
```

### 3. Update CreateProjectForm with Multi-Step

**File**: `components/projects/CreateProjectForm.tsx`

```typescript
import { Stepper } from "@/components/ui/aceternity/stepper";
import { TextGenerateEffect } from "@/components/ui/aceternity/text-generate-effect";
import { HardHat, FileText, MapPin, Calendar } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Define steps
const formSteps = [
  {
    id: "type",
    label: "Project Type",
    icon: <HardHat className="w-6 h-6" />,
    title: "Select Your Project Type",
    description: "Choose the type of construction project you're planning to start.",
  },
  {
    id: "details",
    label: "Project Details",
    icon: <FileText className="w-6 h-6" />,
    title: "Enter Project Details",
    description: "Provide essential information about your project including name and client details.",
  },
  {
    id: "location",
    label: "Location",
    icon: <MapPin className="w-6 h-6" />,
    title: "Project Location",
    description: "Specify where this construction project will take place.",
  },
  {
    id: "timeline",
    label: "Timeline & Budget",
    icon: <Calendar className="w-6 h-6" />,
    title: "Set Timeline and Budget",
    description: "Define your project timeline and budget expectations.",
  },
];

export function CreateProjectForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({...});

  const currentStepData = formSteps[currentStep];

  const handleNext = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress stepper */}
      <Stepper steps={formSteps} currentStep={currentStep} />

      {/* Step content */}
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Step title with text generate effect */}
            <div className="space-y-2">
              <TextGenerateEffect
                words={currentStepData.title}
                className="text-3xl font-bold text-gray-900"
              />
              <p className="text-gray-600">{currentStepData.description}</p>
            </div>

            {/* Step-specific content */}
            <div className="p-6 bg-white rounded-xl border-2 border-gray-200 shadow-construction">
              {currentStep === 0 && <ProjectTypeSelection formData={formData} setFormData={setFormData} />}
              {currentStep === 1 && <ProjectDetailsForm formData={formData} setFormData={setFormData} />}
              {currentStep === 2 && <ProjectLocationForm formData={formData} setFormData={setFormData} />}
              {currentStep === 3 && <TimelineBudgetForm formData={formData} setFormData={setFormData} />}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4">
              <motion.button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={cn(
                  "px-6 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  currentStep === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                )}
                whileHover={{ scale: currentStep > 0 ? 1.05 : 1 }}
                whileTap={{ scale: currentStep > 0 ? 0.95 : 1 }}
              >
                Previous
              </motion.button>

              <motion.button
                type="button"
                onClick={currentStep === formSteps.length - 1 ? handleSubmit : handleNext}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-construction-blue to-blue-700 rounded-lg shadow-construction hover:shadow-construction-lg transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {currentStep === formSteps.length - 1 ? "Create Project" : "Next Step"}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sidebar with dynamic template preview */}
      <DynamicTemplateSidebar
        projectType={formData.type}
        currentStep={currentStep}
      />
    </div>
  );
}
```

### 4. Enhanced Project Type Selection

**3D Card effect for type selection**:

```typescript
function ProjectTypeSelection({ formData, setFormData }: FormProps) {
  const projectTypes = [
    { value: "residential", label: "Residential", icon: "🏠", color: "from-blue-400 to-blue-600" },
    { value: "restaurant_cafe", label: "Restaurant/Cafe", icon: "☕", color: "from-amber-400 to-amber-600" },
    { value: "commercial_office", label: "Commercial", icon: "🏢", color: "from-purple-400 to-purple-600" },
    { value: "industrial", label: "Industrial", icon: "🏭", color: "from-slate-400 to-slate-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {projectTypes.map((type) => (
        <motion.button
          key={type.value}
          type="button"
          onClick={() => setFormData({ ...formData, type: type.value })}
          className={cn(
            "relative p-6 rounded-xl border-2 transition-all duration-300",
            formData.type === type.value
              ? "border-construction-blue shadow-construction-lg"
              : "border-gray-200 hover:border-construction-blue/50 hover:shadow-construction"
          )}
          whileHover={{ scale: 1.05, rotateY: 5 }}
          whileTap={{ scale: 0.95 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className={cn(
            "text-5xl mb-2 bg-gradient-to-br",
            type.color,
            "bg-clip-text text-transparent"
          )}>
            {type.icon}
          </div>
          <h3 className="font-semibold text-gray-900">{type.label}</h3>

          {/* Selected indicator */}
          {formData.type === type.value && (
            <motion.div
              className="absolute -top-2 -right-2 w-8 h-8 bg-construction-blue rounded-full flex items-center justify-center shadow-glow"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Check className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
}
```

## Acceptance Criteria

- [ ] 4 steps with smooth slide transitions
- [ ] Text generate effect on step titles
- [ ] Progress stepper shows completed/current/pending states
- [ ] Current step has pulsing glow effect
- [ ] Project type cards have 3D hover effect
- [ ] Navigation buttons disabled/enabled appropriately
- [ ] Form data persists across steps
- [ ] Template sidebar updates per step
- [ ] Validation on each step before advancing
- [ ] Final step shows review summary

## Testing Checklist

- [ ] All 4 steps accessible via navigation
- [ ] Text animates word-by-word smoothly
- [ ] Stepper transitions animate correctly
- [ ] Project type selection persists
- [ ] "Previous" disabled on step 1
- [ ] "Next" advances to next step
- [ ] "Create Project" submits on final step
- [ ] Form validates before advancing
- [ ] Mobile: Steps stack vertically

## Design Reference

**Aceternity UI Components**:
- [Text Generate Effect](https://ui.aceternity.com/components/text-generate-effect)
- [Multi-Step Form](https://ui.aceternity.com/components/signup-form)
- [3D Card](https://ui.aceternity.com/components/3d-card-effect)

**Animation Specs**:
- Text generate: 50ms delay per word, 500ms duration
- Step transition: 300ms slide + fade
- Stepper glow: 2s infinite pulse
- Type card 3D: rotateY(5deg) on hover

## Notes

- Stepper icons: HardHat, FileText, MapPin, Calendar
- Progress line: Gradient blue → orange
- Step content: Slide right to enter, slide left to exit
- Template sidebar: Updates based on selected type + current step
- Validation: Show errors before allowing "Next"

---

**Status**: Pending
**Dependencies**: All Phase 2 tasks (0001-0004)
**Next Phase**: Phase 3 - Tasks Module Enhancement
