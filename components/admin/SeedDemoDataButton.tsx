'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { seedDemoData } from '@/app/actions/seed-demo-data';
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function SeedDemoDataButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const handleSeed = async () => {
    if (!confirm('⚠️ WARNING: This will DELETE all existing projects and create 10 new demo projects. Are you sure?')) {
      return;
    }

    setIsSeeding(true);
    setResult(null);

    try {
      const response = await seedDemoData();
      setResult(response);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleSeed}
        disabled={isSeeding}
        variant="destructive"
        size="lg"
        className="w-full sm:w-auto"
      >
        {isSeeding ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Seeding Demo Data...
          </>
        ) : (
          <>
            <Database className="mr-2 h-4 w-4" />
            Reset & Seed Demo Data
          </>
        )}
      </Button>

      {result && (
        <div
          className={`p-4 rounded-lg border ${
            result.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {result.success ? (
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Success!</p>
                <p className="text-sm mt-1">{result.message}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{result.error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-sm text-gray-600 space-y-2">
        <p className="font-semibold">This will:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Delete all existing projects and related data (cascades)</li>
          <li>Create 10 new realistic construction projects:
            <ul className="list-circle list-inside ml-6 mt-1 space-y-0.5">
              <li>2 Residential projects</li>
              <li>2 Restaurant projects</li>
              <li>2 Cafe projects</li>
              <li>2 Commercial Office projects</li>
              <li>2 Industrial projects</li>
            </ul>
          </li>
          <li>Create phases for each project (from templates)</li>
          <li>Create tasks for each phase (from templates)</li>
          <li>Link projects to default 3D models</li>
          <li>Set realistic statuses, health scores, and progress</li>
        </ul>
      </div>
    </div>
  );
}
