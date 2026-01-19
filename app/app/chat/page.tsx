import { Suspense } from "react";
import {
  getChatRooms,
  getCompanyUsers,
  getCurrentUserContext,
} from "@/app/actions/chat-queries";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { ChatErrorState } from "@/components/chat/ChatErrorState";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";
import { Loader2 } from "lucide-react";

// Chat page - Server component that fetches initial room data and company users
export default async function ChatPage() {
  // Fetch rooms, users, and user context in parallel
  const [roomsResult, usersResult, userContextResult] = await Promise.all([
    getChatRooms(),
    getCompanyUsers(),
    getCurrentUserContext(),
  ]);

  if (roomsResult.error) {
    return <ChatErrorState error={roomsResult.error} />;
  }

  // Check user context
  if (userContextResult.error || !userContextResult.userId) {
    return (
      <ChatErrorState
        error={userContextResult.error || "Failed to load user context"}
      />
    );
  }

  const userContext = {
    userId: userContextResult.userId,
    userName: userContextResult.userName || "User",
    companyId: userContextResult.companyId || "",
  };

  return (
    <Suspense fallback={<ChatLoadingSkeleton />}>
      <SessionProviderWrapper>
        <ChatLayout
          initialRooms={roomsResult.rooms || []}
          companyUsers={usersResult.users || []}
          userContext={userContext}
        />
      </SessionProviderWrapper>
    </Suspense>
  );
}

// Loading skeleton with construction theme
function ChatLoadingSkeleton() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar skeleton */}
      <div className="w-full md:w-[300px] border-r border-gray-200 bg-white p-4 space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 p-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Main area skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-gray-200 bg-white flex items-center px-6">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-construction-blue" />
        </div>
      </div>
    </div>
  );
}
