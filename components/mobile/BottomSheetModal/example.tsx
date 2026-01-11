/**
 * BottomSheetModal Usage Examples
 *
 * This file demonstrates various usage patterns for the BottomSheetModal component.
 * These are example code snippets - not meant to be imported directly.
 */

'use client';

import { useState } from 'react';
import { CheckSquare, Filter, Settings, Trash2, Building2 } from 'lucide-react';
import { BottomSheetModal } from './index';

// =============================================================================
// Example 1: Basic Usage - Simple modal with title and content
// =============================================================================
export function BasicExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>

      <BottomSheetModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Task Details"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This is a simple bottom sheet modal with just a title and content.
          </p>
        </div>
      </BottomSheetModal>
    </>
  );
}

// =============================================================================
// Example 2: Full Featured - Icon, title, subtitle, badges, and actions
// =============================================================================
export function FullFeaturedExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Full Modal</button>

      <BottomSheetModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        icon={CheckSquare}
        title="Edit Task"
        subtitle="Update task details and save changes"
        badges={
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
            In Progress
          </span>
        }
        leftActions={
          <button
            onClick={() => console.log('Delete')}
            className="h-12 px-4 text-red-600 font-medium rounded-xl active:bg-red-50 transition-colors"
          >
            Delete
          </button>
        }
        rightActions={
          <button
            onClick={() => setIsOpen(false)}
            className="h-12 px-6 bg-[#001B51] text-white font-semibold rounded-xl active:scale-[0.98] active:bg-[#001B51]/90 transition-all"
          >
            Save Changes
          </button>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Task Name</label>
            <input
              type="text"
              defaultValue="Install kitchen cabinets"
              className="w-full h-14 px-4 text-base border border-gray-200 rounded-xl focus:border-[#001B51] focus:ring-1 focus:ring-[#001B51]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="w-full h-32 px-4 py-3 text-base border border-gray-200 rounded-xl focus:border-[#001B51] focus:ring-1 focus:ring-[#001B51] resize-none"
              placeholder="Add notes..."
            />
          </div>
        </div>
      </BottomSheetModal>
    </>
  );
}

// =============================================================================
// Example 3: Filter Sheet - Common pattern for filter controls
// =============================================================================
export function FilterSheetExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const projects = [
    { id: '1', name: 'Downtown Office Renovation' },
    { id: '2', name: 'Harbor View Apartments' },
    { id: '3', name: 'Tech Campus Phase 2' },
  ];

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        <Filter className="w-5 h-5" />
        Filters
      </button>

      <BottomSheetModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        icon={Filter}
        title="Filters"
        subtitle="Filter tasks by project"
        snapPoints={['content', 'half']}
        rightActions={
          <button
            onClick={() => setIsOpen(false)}
            className="h-12 px-6 bg-[#001B51] text-white font-semibold rounded-xl active:scale-[0.98] transition-all"
          >
            Apply
          </button>
        }
      >
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 mb-3">Select Project</p>
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project.id)}
              className={`
                w-full text-left p-4 rounded-xl border-2 transition-all
                active:scale-[0.99]
                ${selectedProject === project.id
                  ? 'border-[#001B51] bg-[#001B51]/5'
                  : 'border-gray-200 bg-white'
                }
              `}
            >
              <span className="font-medium text-gray-900">{project.name}</span>
            </button>
          ))}
        </div>
      </BottomSheetModal>
    </>
  );
}

// =============================================================================
// Example 4: Confirmation Sheet - Delete confirmation pattern
// =============================================================================
export function ConfirmationSheetExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Delete Task</button>

      <BottomSheetModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        icon={Trash2}
        title="Delete Task?"
        subtitle="This action cannot be undone. The task and all its data will be permanently removed."
        theme="high" // Red theme for destructive actions
        snapPoints={['content']}
        leftActions={
          <button
            onClick={() => setIsOpen(false)}
            className="h-12 px-6 text-gray-600 font-medium rounded-xl active:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        }
        rightActions={
          <button
            onClick={() => {
              console.log('Deleting...');
              setIsOpen(false);
            }}
            className="h-12 px-6 bg-red-600 text-white font-semibold rounded-xl active:scale-[0.98] active:bg-red-700 transition-all"
          >
            Delete
          </button>
        }
      >
        {/* Optional: Additional content */}
        <div className="p-4 bg-red-50 rounded-xl">
          <p className="text-sm text-red-800">
            <strong>Warning:</strong> 3 subtasks will also be deleted.
          </p>
        </div>
      </BottomSheetModal>
    </>
  );
}

// =============================================================================
// Example 5: Settings Sheet - Scrollable content with many options
// =============================================================================
export function SettingsSheetExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        <Settings className="w-5 h-5" />
      </button>

      <BottomSheetModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        icon={Settings}
        title="View Settings"
        snapPoints={['half', 'full']}
        initialSnapPoint="half"
        showFooter={false} // No footer for settings
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Display
            </h3>
            <div className="space-y-2">
              {['Compact View', 'Show Subtasks', 'Show Due Dates', 'Show Assignees'].map((setting) => (
                <label key={setting} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-base text-gray-900">{setting}</span>
                  <input type="checkbox" className="w-5 h-5 rounded" />
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Sort By
            </h3>
            <div className="space-y-2">
              {['Due Date', 'Priority', 'Created Date', 'Alphabetical'].map((option) => (
                <button
                  key={option}
                  className="w-full text-left p-4 bg-gray-50 rounded-xl active:bg-gray-100 transition-colors"
                >
                  <span className="text-base text-gray-900">{option}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheetModal>
    </>
  );
}

// =============================================================================
// Example 6: Project Details - Using project/task specific theme
// =============================================================================
export function ProjectDetailsExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>View Project</button>

      <BottomSheetModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        icon={Building2}
        title="Downtown Office Renovation"
        subtitle="123 Main Street, Suite 400"
        theme="success" // Green theme for on-track projects
        badges={
          <>
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              On Track
            </span>
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              Phase 2
            </span>
          </>
        }
        snapPoints={['half', 'full']}
        rightActions={
          <button
            onClick={() => console.log('Navigate to project')}
            className="h-12 px-6 bg-[#059669] text-white font-semibold rounded-xl active:scale-[0.98] transition-all"
          >
            View Details
          </button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Progress</p>
              <p className="text-2xl font-bold text-[#001B51]">67%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Tasks</p>
              <p className="text-2xl font-bold text-[#001B51]">24/36</p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500 mb-2">Next Milestone</p>
            <p className="text-base font-medium text-gray-900">Electrical Inspection</p>
            <p className="text-sm text-gray-500">Due in 3 days</p>
          </div>
        </div>
      </BottomSheetModal>
    </>
  );
}
