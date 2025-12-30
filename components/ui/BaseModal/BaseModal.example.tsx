/**
 * BaseModal Usage Examples
 * Demonstrates all features and configurations
 */

'use client';

import { useState } from 'react';
import { HardHat, Wrench, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BaseModal } from './index';
import { Button } from '@/components/ui/button';

/**
 * Example 1: Basic Modal (Default Theme)
 */
export function BasicModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Basic Modal</Button>

      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        icon={HardHat}
        title="Basic Modal"
        subtitle="This is a simple modal with default construction theme"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            This is the modal content area. It can contain any React components.
          </p>
          <p className="text-gray-700">
            The modal is responsive - it appears as a bottom sheet on mobile
            and a centered dialog on desktop.
          </p>
        </div>
      </BaseModal>
    </>
  );
}

/**
 * Example 2: Modal with Footer Actions
 */
export function ModalWithActionsExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal with Actions</Button>

      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        icon={Building2}
        title="Create New Project"
        subtitle="Enter project details to get started"
        leftActions={
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        }
        rightActions={
          <>
            <Button variant="outline">Save Draft</Button>
            <Button>Create Project</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Enter project description"
            />
          </div>
        </div>
      </BaseModal>
    </>
  );
}

/**
 * Example 3: Modal with Steps (Multi-step Form)
 */
export function SteppedModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const steps = ['Basic Info', 'Details', 'Review'];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Stepped Modal</Button>

      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        icon={Wrench}
        title="Create Task"
        subtitle={`Step ${currentStep} of ${steps.length}`}
        steps={steps}
        currentStep={currentStep}
        leftActions={
          currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )
        }
        rightActions={
          <>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {currentStep < steps.length ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button onClick={() => setIsOpen(false)}>Complete</Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {currentStep === 1 && (
            <div>
              <h3 className="font-semibold mb-2">Step 1: Basic Info</h3>
              <p className="text-gray-700">Enter basic task information.</p>
            </div>
          )}
          {currentStep === 2 && (
            <div>
              <h3 className="font-semibold mb-2">Step 2: Details</h3>
              <p className="text-gray-700">Add detailed task information.</p>
            </div>
          )}
          {currentStep === 3 && (
            <div>
              <h3 className="font-semibold mb-2">Step 3: Review</h3>
              <p className="text-gray-700">Review and confirm your task.</p>
            </div>
          )}
        </div>
      </BaseModal>
    </>
  );
}

/**
 * Example 4: Priority-Based Themes
 */
export function PriorityThemedModalsExample() {
  const [openModal, setOpenModal] = useState<string | null>(null);

  const priorities = [
    { theme: 'low', icon: CheckCircle2, title: 'Low Priority', color: 'green' },
    { theme: 'medium', icon: AlertTriangle, title: 'Medium Priority', color: 'amber' },
    { theme: 'high', icon: AlertTriangle, title: 'High Priority', color: 'red' },
  ];

  return (
    <div className="flex gap-2">
      {priorities.map(({ theme, icon: Icon, title }) => (
        <div key={theme}>
          <Button
            onClick={() => setOpenModal(theme)}
            variant="outline"
          >
            Open {title}
          </Button>

          <BaseModal
            isOpen={openModal === theme}
            onClose={() => setOpenModal(null)}
            icon={Icon}
            title={title}
            subtitle={`This modal uses the ${theme} priority theme`}
            theme={theme}
            badges={
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                {title.toUpperCase()}
              </span>
            }
            rightActions={
              <Button onClick={() => setOpenModal(null)}>Close</Button>
            }
          >
            <div className="space-y-4">
              <p className="text-gray-700">
                The modal theme automatically changes based on priority level,
                using construction-inspired safety colors.
              </p>
            </div>
          </BaseModal>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 5: Large Modal with Scrollable Content
 */
export function LargeScrollableModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Large Modal</Button>

      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        icon={Building2}
        title="Project Documentation"
        subtitle="Complete project specifications and details"
        maxWidth="4xl"
        rightActions={
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        }
      >
        <div className="space-y-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <h3 className="font-semibold text-lg mb-2">Section {i + 1}</h3>
              <p className="text-gray-700">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          ))}
        </div>
      </BaseModal>
    </>
  );
}

/**
 * Example 6: Form with Key Remounting
 */
export function FormRemountExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const handleOpen = () => {
    setFormKey(Date.now()); // Reset form on open
    setIsOpen(true);
  };

  return (
    <>
      <Button onClick={handleOpen}>Open Form Modal</Button>

      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        icon={Wrench}
        title="Create Item"
        subtitle="Form resets each time modal opens"
        formKey={formKey}
        rightActions={
          <>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsOpen(false)}>Submit</Button>
          </>
        }
      >
        <div className="space-y-4">
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="This field resets on modal open"
            defaultValue=""
          />
        </div>
      </BaseModal>
    </>
  );
}

/**
 * Demo Page Component
 * Shows all examples
 */
export function BaseModalDemoPage() {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          BaseModal Component Examples
        </h1>
        <p className="text-gray-600">
          Explore different configurations and use cases for the BaseModal component
        </p>
      </div>

      <div className="space-y-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Basic Modal</h2>
          <p className="text-gray-600 mb-4">Simple modal with default theme</p>
          <BasicModalExample />
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Modal with Actions</h2>
          <p className="text-gray-600 mb-4">Modal with footer action buttons</p>
          <ModalWithActionsExample />
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Stepped Modal</h2>
          <p className="text-gray-600 mb-4">Multi-step form with progress indicator</p>
          <SteppedModalExample />
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Priority Themes</h2>
          <p className="text-gray-600 mb-4">Different themes based on priority</p>
          <PriorityThemedModalsExample />
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Large Scrollable Modal</h2>
          <p className="text-gray-600 mb-4">Modal with lots of content</p>
          <LargeScrollableModalExample />
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Form with Key Remounting</h2>
          <p className="text-gray-600 mb-4">Form that resets on each open</p>
          <FormRemountExample />
        </div>
      </div>
    </div>
  );
}
