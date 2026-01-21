import { SeedDemoDataButton } from '@/components/admin/SeedDemoDataButton';

export default function SeedDataPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Blueprint Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 27, 81, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 27, 81, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Industrial Header */}
      <div className="relative border-b h-1 bg-construction-blue" />

      <div className="relative max-w-4xl mx-auto p-4 md:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white mb-2">
            Admin: Seed Demo Data
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Reset and populate the database with realistic demo construction projects
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-construction rounded-lg p-6 md:p-8">
          <SeedDemoDataButton />
        </div>

        {/* Warning Notice */}
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400 dark:text-yellow-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Warning:</strong> This action is irreversible. All existing projects, tasks,
                phases, expenses, and related data will be permanently deleted. Only use this for
                testing or demo purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400 dark:text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> After seeding, navigate to the Projects page to see the new demo
                projects. Each project will have phases, tasks, and a linked 3D model.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
