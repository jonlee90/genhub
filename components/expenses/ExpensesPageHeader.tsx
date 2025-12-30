'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Receipt } from 'lucide-react';
import { CreateExpenseModal } from './CreateExpenseModal';

// Debug: Client component for expenses page header with modal trigger
interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  project_id: string;
}

interface ExpensesPageHeaderProps {
  projects: Project[];
  tasks: Task[];
}

export function ExpensesPageHeader({ projects, tasks }: ExpensesPageHeaderProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Debug: Track modal state
  console.log('[ExpensesPageHeader] Modal open:', showCreateModal);

  return (
    <>
      <Button
        size="lg"
        onClick={() => {
          console.log('[ExpensesPageHeader] Opening create expense modal');
          setShowCreateModal(true);
        }}
        className="relative h-11 md:h-14 px-4 md:px-8 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg hover:shadow-construction-xl transition-all group overflow-hidden text-white"
      >
        <div className="absolute inset-0 bg-construction-accent opacity-0 group-hover:opacity-10 transition-opacity" />
        <Receipt className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-12 transition-transform" />
        <span className="font-black text-sm md:text-base">SUBMIT</span>
        <span className="hidden sm:inline font-black text-sm md:text-base ml-1">EXPENSE</span>
      </Button>

      {/* Create Expense Modal */}
      {showCreateModal && (
        <CreateExpenseModal
          projects={projects}
          tasks={tasks}
          onClose={() => {
            console.log('[ExpensesPageHeader] Closing create expense modal');
            setShowCreateModal(false);
          }}
        />
      )}
    </>
  );
}
