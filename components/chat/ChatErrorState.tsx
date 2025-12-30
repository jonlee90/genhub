'use client';

import { AlertTriangle } from 'lucide-react';

interface ChatErrorStateProps {
  error: string;
}

// Debug: Client component for error state with retry button
export function ChatErrorState({ error }: ChatErrorStateProps) {
  console.log('[ChatErrorState] Rendering error state:', error);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center space-y-4 max-w-md px-6">
        {/* Debug: Error state with construction theme */}
        <div className="inline-flex p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <AlertTriangle className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Failed to Load Chat Rooms
        </h2>
        <p className="text-sm text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-construction-blue text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          aria-label="Retry loading chat rooms"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
