import { Button } from "@/components/ui/button";

interface TaskDetailDeleteModalContentProps {
  title: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function TaskDetailDeleteModalContent({
  title,
  isDeleting,
  onCancel,
  onConfirm,
}: TaskDetailDeleteModalContentProps) {
  return (
    <div className="space-y-4">
      <p className="text-gray-700">
        You are about to delete the task <strong>&quot;{title}&quot;</strong>.
      </p>
      <p className="text-gray-700">
        All activity history, dependencies, and associated data will be
        permanently removed.
      </p>
      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-2 font-bold"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={isDeleting}
          className="bg-red-600 hover:bg-red-700 font-bold"
        >
          {isDeleting ? "Deleting..." : "Delete Task"}
        </Button>
      </div>
    </div>
  );
}
