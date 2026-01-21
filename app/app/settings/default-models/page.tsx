import { Suspense } from 'react';
import { SettingsSectionHeader } from '@/components/settings/SettingsSectionHeader';
import { DefaultModelCard } from '@/components/settings/DefaultModelCard';
import { Wrench } from 'lucide-react';
import { auth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import { getDefaultModelsForCompany } from '@/app/actions/default-models';
import { redirect } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Default 3D Models Settings Page
 * Admin only - Configure company-specific default models for each project type
 * Server Component - fetches data server-side, passes to client components
 */
export default function DefaultModelsPage() {
  return (
    <Suspense fallback={<DefaultModelsLoading />}>
      <DefaultModelsPageContent />
    </Suspense>
  );
}

async function DefaultModelsPageContent() {
  console.log('[DefaultModelsPage] Rendering default models settings');

  // Check authentication and role
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/');
  }

  const supabase = await createClient();
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  // Only Admins can access this page
  if (companyUser?.role !== 'admin') {
    redirect('/app/settings');
  }

  // Fetch all default models for company
  const result = await getDefaultModelsForCompany();

  if (!result.success) {
    console.error('[DefaultModelsPage] Error fetching default models:', result.error);
    return (
      <div className="flex-1 p-8">
        <div className="text-red-600 font-semibold">
          Error loading default models: {result.error}
        </div>
      </div>
    );
  }

  const defaultModels = result.data;

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950">
      {/* Blueprint Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23001B51' stroke-width='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Industrial Header */}
      <div className="relative z-10 border-b-2 border-construction-blue dark:border-gray-700">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight p-4 md:p-8 text-construction-blue dark:text-white">
          Default 3D Models
        </h1>
      </div>

      {/* Page Content */}
      <div className="relative z-10 flex-1 space-y-4 md:space-y-6 p-4 md:p-8">
        {/* Section Header */}
        <SettingsSectionHeader
          icon={Wrench}
          title="Company Default Models"
          description="Configure default 3D models for each project type. These models will be automatically assigned to new projects."
        />

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-construction-blue dark:border-blue-400 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-construction-blue rounded-lg">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-construction-blue dark:text-white">How Default Models Work</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                When creating a new project, GenHub will automatically load the default model for that project type.
                You can use the system defaults provided by GenHub, or upload your own custom IFC files to replace them.
              </p>
              <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li><span className="font-semibold">System Default:</span> GenHub-provided template model</li>
                <li><span className="font-semibold">Custom Model:</span> Your own uploaded IFC file (replaces system default)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Default Model Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {defaultModels.map((model) => (
            <DefaultModelCard
              key={model.projectTypeConfigId}
              projectTypeConfigId={model.projectTypeConfigId}
              projectTypeName={model.projectTypeName}
              projectTypeDescription={model.projectTypeDescription}
              iconName={model.iconName}
              systemDefault={model.systemDefault}
              companyCustom={model.companyCustom}
            />
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          Changes to default models will only affect new projects. Existing projects will keep their current models.
        </div>
      </div>
    </div>
  );
}

function DefaultModelsLoading() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950">
      {/* Blueprint Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23001B51' stroke-width='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Industrial Header */}
      <div className="relative z-10 border-b-2 border-construction-blue dark:border-gray-700">
        <Skeleton className="h-10 w-64 m-4 md:m-8" />
      </div>

      {/* Page Content */}
      <div className="relative z-10 flex-1 space-y-4 md:space-y-6 p-4 md:p-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}
