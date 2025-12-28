import { CreateProjectForm } from '@/components/projects/CreateProjectForm';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'New Project | GenHub',
  description: 'Create a new construction project',
};

export default function NewProjectPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Back Link */}
      <Link href="/app/projects">
        <Button variant="ghost" size="sm" className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Back to Projects
        </Button>
      </Link>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create New Project</h2>
        <p className="text-muted-foreground">
          Set up a new construction project with client details and timeline
        </p>
      </div>

      {/* Form */}
      <CreateProjectForm />
    </div>
  );
}
