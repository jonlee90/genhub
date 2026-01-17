"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
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

export function ExpensesPageHeader({
  projects,
  tasks,
  companyId,
}: ExpensesPageHeaderProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { registerCreateModal, unregisterCreateModal } = useBottomNav();

  // Register create modal data for bottom nav
  useEffect(() => {
    registerCreateModal("/app/expenses", { projects, tasks, companyId });
    return () => unregisterCreateModal("/app/expenses");
  }, [projects, tasks, companyId, registerCreateModal, unregisterCreateModal]);

  return (
    <>
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

      {/* Create Expense Modal */}
      {showCreateModal && (
        <CreateExpenseModal
          projects={projects}
          tasks={tasks}
          onClose={() => setShowCreateModal(false)}
          companyId={companyId}
        />
      )}
    </>
  );
}
