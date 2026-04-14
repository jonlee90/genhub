"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Receipt, Upload } from "lucide-react";
import { useBottomNav } from "@/lib/contexts/BottomNavContext";

// Client component for expenses page header with modal trigger
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
  companyId?: string;
}

const CreateExpenseModal = dynamic(
  () => import("./CreateExpenseModal").then((mod) => mod.CreateExpenseModal),
  { ssr: false },
);

const ImportExpensesModal = dynamic(
  () => import("./ImportExpensesModal").then((mod) => mod.ImportExpensesModal),
  { ssr: false },
);

export function ExpensesPageHeader({
  projects,
  tasks,
  companyId,
}: ExpensesPageHeaderProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const router = useRouter();
  const {
    registerCreateModal,
    unregisterCreateModal,
    openModal,
    closeCreateModal,
  } = useBottomNav();

  // Register create modal data for bottom nav
  useEffect(() => {
    registerCreateModal("/app/expenses", { projects, tasks, companyId });
    return () => unregisterCreateModal("/app/expenses");
  }, [projects, tasks, companyId, registerCreateModal, unregisterCreateModal]);

  // Listen to openModal from BottomNavContext and open the local modal
  useEffect(() => {
    if (openModal === "expense") {
      setShowCreateModal(true);
      // Close the context modal state so it doesn't interfere
      closeCreateModal();
    }
  }, [openModal, closeCreateModal]);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="lg"
          onClick={() => setShowImportModal(true)}
          className="relative h-11 md:h-14 px-4 md:px-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 shadow-sm transition-all group"
        >
          <Upload className="mr-1.5 h-4 w-4 md:h-5 md:w-5" />
          <span className="font-semibold text-sm md:text-base">IMPORT</span>
        </Button>

        <Button
          size="lg"
          onClick={() => setShowCreateModal(true)}
          className="relative h-11 md:h-14 px-4 md:px-8 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-lg hover:shadow-construction-xl transition-all group overflow-hidden text-white"
        >
          <Receipt className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5 group-hover:rotate-12 transition-transform" />
          <span className="font-black text-sm md:text-base">SUBMIT</span>
          <span className="hidden sm:inline font-black text-sm md:text-base ml-1">
            EXPENSE
          </span>
        </Button>
      </div>

      {/* Create Expense Modal */}
      {showCreateModal && (
        <CreateExpenseModal
          projects={projects}
          tasks={tasks}
          onClose={() => setShowCreateModal(false)}
          companyId={companyId}
        />
      )}

      {/* Import Expenses Modal */}
      {showImportModal && (
        <ImportExpensesModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
