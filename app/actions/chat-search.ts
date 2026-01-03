'use server';

import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';

// ============================================
// Validation Schemas
// ============================================

const searchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Query too long'),
});

const searchTasksSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Query too long'),
  projectId: z.string().uuid('Invalid project ID').optional().nullable(),
});

const searchUsersSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Query too long'),
  roomId: z.string().uuid('Invalid room ID'),
});

const searchMessagesSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  chatRoomId: z.string().uuid('Invalid chat room ID').optional().nullable(),
});

// ============================================
// Types
// ============================================

export interface ProjectSearchResult {
  id: string;
  name: string;
  status: string;
  health_score: number;
}

export interface TaskSearchResult {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  due_date: string | null;
  assignee_id: string | null;
  project_id: string;
}

export interface MaterialSearchResult {
  id: string;
  product_name: string;
  unit_price: number;
  stock_status: string | null;
  product_image_url: string | null;
}

export interface ExpenseSearchResult {
  id: string;
  description: string;
  amount: number;
  status: string;
  vendor_name: string | null;
}

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

export interface MessageSearchResult {
  id: string;
  content: string;
  snippet: string;
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  chatRoom: {
    id: string;
    name: string;
    type: string;
    project_id: string | null;
  };
  created_at: string;
  entityReferences: any[];
}

// ============================================
// Helper Functions
// ============================================

async function getUserContext() {
  console.log('[getUserContext] Getting user session...');

  // Get NextAuth session
  const session = await auth();

  if (!session?.user?.id) {
    console.error('[getUserContext] No authenticated user found');
    return { error: 'Not authenticated' };
  }

  console.log('[getUserContext] User authenticated:', session.user.id);

  // Create Supabase client
  const supabase = await createClient();

  // Get user's company and role using NextAuth user ID
  const companyUserResult = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single();

  if (companyUserResult.error || !companyUserResult.data) {
    console.error('[getUserContext] No active company found:', companyUserResult.error);
    return { error: 'No active company found for user' };
  }

  type CompanyUserData = { company_id: string; role: string; status: string };
  const companyUser = companyUserResult.data as unknown as CompanyUserData;

  console.log('[getUserContext] User context loaded:', {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
  });

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
}

// ============================================
// Search Functions
// ============================================

/**
 * Search projects user has access to
 * Returns: id, name, status, health_score
 * @param query - Search query string (case-insensitive, searches name)
 * @returns Array of ProjectSearchResult (max 10)
 */
export async function searchProjects(query: string) {
  console.log('[searchProjects] Searching projects with query:', query);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Validate input
  const validation = searchQuerySchema.safeParse({ query });
  if (!validation.success) {
    console.error('[searchProjects] Validation failed:', validation.error);
    return {
      error: 'Invalid search query',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { query: searchQuery } = validation.data;

  console.log('[searchProjects] Searching in company:', companyId);

  // Search projects by name (case-insensitive)
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, status, health_score')
    .eq('company_id', companyId)
    .ilike('name', `%${searchQuery}%`)
    .order('name', { ascending: true })
    .limit(10);

  if (error) {
    console.error('[searchProjects] Error searching projects:', error);
    return { error: 'Failed to search projects' };
  }

  console.log('[searchProjects] Found', projects?.length || 0, 'projects');

  return {
    success: true,
    results: (projects || []) as unknown as ProjectSearchResult[],
  };
}

/**
 * Search tasks (optionally filtered by project)
 * Returns: id, title, status, priority, due_date, assignee_id, project_id
 * @param query - Search query string (case-insensitive, searches title)
 * @param projectId - Optional project ID to filter by
 * @returns Array of TaskSearchResult (max 10)
 */
export async function searchTasks(query: string, projectId?: string | null) {
  console.log('[searchTasks] Searching tasks with query:', query, 'projectId:', projectId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Validate input
  const validation = searchTasksSchema.safeParse({ query, projectId });
  if (!validation.success) {
    console.error('[searchTasks] Validation failed:', validation.error);
    return {
      error: 'Invalid search parameters',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { query: searchQuery, projectId: filterProjectId } = validation.data;

  console.log('[searchTasks] Searching in company:', companyId);

  // Build query - join with projects to filter by company
  let tasksQuery = supabase
    .from('tasks')
    .select(`
      id,
      title,
      status,
      priority,
      due_date,
      assignee_id,
      project_id,
      projects!inner (company_id)
    `)
    .eq('projects.company_id', companyId)
    .ilike('title', `%${searchQuery}%`);

  // Filter by project if provided
  if (filterProjectId) {
    tasksQuery = tasksQuery.eq('project_id', filterProjectId);
  }

  const { data: tasks, error } = await tasksQuery
    .order('title', { ascending: true })
    .limit(10);

  if (error) {
    console.error('[searchTasks] Error searching tasks:', error);
    return { error: 'Failed to search tasks' };
  }

  console.log('[searchTasks] Found', tasks?.length || 0, 'tasks');

  // Remove the joined projects field from results
  const results = (tasks || []).map((item: any) => {
    const { projects, ...task } = item;
    return task;
  }) as unknown as TaskSearchResult[];

  return {
    success: true,
    results,
  };
}

/**
 * Search materials from company catalog
 * Returns: id, product_name, unit_price, stock_status, product_image_url
 * @param query - Search query string (case-insensitive, searches product_name)
 * @returns Array of MaterialSearchResult (max 10)
 */
export async function searchMaterials(query: string) {
  console.log('[searchMaterials] Searching materials with query:', query);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Validate input
  const validation = searchQuerySchema.safeParse({ query });
  if (!validation.success) {
    console.error('[searchMaterials] Validation failed:', validation.error);
    return {
      error: 'Invalid search query',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { query: searchQuery } = validation.data;

  console.log('[searchMaterials] Searching in company:', companyId);

  // Search materials by product name (case-insensitive)
  const { data: materials, error } = await supabase
    .from('materials')
    .select('id, product_name, unit_price, stock_status, product_image_url')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .ilike('product_name', `%${searchQuery}%`)
    .order('product_name', { ascending: true })
    .limit(10);

  if (error) {
    console.error('[searchMaterials] Error searching materials:', error);
    return { error: 'Failed to search materials' };
  }

  console.log('[searchMaterials] Found', materials?.length || 0, 'materials');

  return {
    success: true,
    results: (materials || []) as MaterialSearchResult[],
  };
}

/**
 * Search expenses
 * Returns: id, description, amount, status, vendor_name
 * @param query - Search query string (case-insensitive, searches description and vendor_name)
 * @returns Array of ExpenseSearchResult (max 10)
 */
export async function searchExpenses(query: string) {
  console.log('[searchExpenses] Searching expenses with query:', query);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Validate input
  const validation = searchQuerySchema.safeParse({ query });
  if (!validation.success) {
    console.error('[searchExpenses] Validation failed:', validation.error);
    return {
      error: 'Invalid search query',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { query: searchQuery } = validation.data;

  console.log('[searchExpenses] Searching in company:', companyId);

  // Search expenses by description or vendor name (case-insensitive)
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('id, description, amount, status, vendor_name')
    .eq('company_id', companyId)
    .or(`description.ilike.%${searchQuery}%,vendor_name.ilike.%${searchQuery}%`)
    .order('expense_date', { ascending: false })
    .limit(10);

  if (error) {
    console.error('[searchExpenses] Error searching expenses:', error);
    return { error: 'Failed to search expenses' };
  }

  console.log('[searchExpenses] Found', expenses?.length || 0, 'expenses');

  return {
    success: true,
    results: (expenses || []) as ExpenseSearchResult[],
  };
}

/**
 * Search users in current chat room
 * Returns: id, name, email, avatar_url, role
 * @param query - Search query string (case-insensitive, searches name and email)
 * @param roomId - Chat room ID to search within
 * @returns Array of UserSearchResult (max 10)
 */
export async function searchUsers(query: string, roomId: string) {
  console.log('[searchUsers] Searching users with query:', query, 'in room:', roomId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // Validate input
  const validation = searchUsersSchema.safeParse({ query, roomId });
  if (!validation.success) {
    console.error('[searchUsers] Validation failed:', validation.error);
    return {
      error: 'Invalid search parameters',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { query: searchQuery, roomId: chatRoomId } = validation.data;

  // Verify user is a participant in the chat room
  const { data: participant, error: participantError } = await supabase
    .from('chat_participants')
    .select('id')
    .eq('chat_room_id', chatRoomId)
    .eq('user_id', userId)
    .single();

  if (participantError || !participant) {
    console.error('[searchUsers] User is not a participant in this room:', participantError);
    return { error: 'You do not have access to this chat room' };
  }

  console.log('[searchUsers] Searching users in chat room:', chatRoomId);

  // Search users who are participants in the chat room
  const { data: users, error } = await supabase
    .from('chat_participants')
    .select(`
      user_id,
      role,
      user_profiles!chat_participants_user_id_fkey (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq('chat_room_id', chatRoomId)
    .or(`user_profiles.name.ilike.%${searchQuery}%,user_profiles.email.ilike.%${searchQuery}%`)
    .limit(10);

  if (error) {
    console.error('[searchUsers] Error searching users:', error);
    return { error: 'Failed to search users' };
  }

  console.log('[searchUsers] Found', users?.length || 0, 'users');

  // Transform results
  const results: UserSearchResult[] = (users || [])
    .filter((participant: any) => participant.user_profiles)
    .map((participant: any) => ({
      id: participant.user_profiles.id,
      name: participant.user_profiles.name,
      email: participant.user_profiles.email,
      avatar_url: participant.user_profiles.avatar_url,
      role: participant.role,
    }));

  return {
    success: true,
    results,
  };
}

/**
 * Search messages using PostgreSQL full-text search
 * Task 0021: Message Search
 *
 * @param query - Search query string
 * @param chatRoomId - Optional room ID to filter search to specific room
 * @returns Array of matching messages with highlighted snippets, sender info, and room details
 */
export async function searchMessages(query: string, chatRoomId?: string | null) {
  console.log('[searchMessages] Starting search:', { query, chatRoomId });

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // Validate input
  const validation = searchMessagesSchema.safeParse({ query, chatRoomId });
  if (!validation.success) {
    console.error('[searchMessages] Validation failed:', validation.error.flatten());
    return {
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors
    };
  }

  const data = validation.data;

  console.log('[searchMessages] Validated search params:', {
    query: data.query,
    chatRoomId: data.chatRoomId,
  });

  // SECURITY FIX (H1): Use 'plain' type to prevent tsquery injection
  // The 'plain' type automatically escapes special characters and converts to tsquery safely
  console.log('[searchMessages] Search query:', data.query);

  try {
    // Build query to search messages
    let searchQuery = supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        chat_room_id,
        sender_id,
        entity_references,
        sender:user_profiles!messages_sender_id_fkey (
          id,
          name,
          avatar_url
        ),
        chat_room:chat_rooms!messages_chat_room_id_fkey (
          id,
          name,
          type,
          project_id
        )
      `)
      .is('deleted_at', null); // Exclude soft-deleted messages

    // Debug: Filter by chatRoomId if provided
    if (data.chatRoomId) {
      console.log('[searchMessages] Filtering by chat room:', data.chatRoomId);
      searchQuery = searchQuery.eq('chat_room_id', data.chatRoomId);
    }

    // SECURITY FIX (H1): Use 'plain' type instead of 'websearch' to safely escape special characters
    // This prevents tsquery injection attacks via characters like :, !, &, |, (, )
    searchQuery = searchQuery.textSearch('content', data.query, {
      type: 'plain', // Use plain type for safe automatic escaping
      config: 'english',
    });

    // Debug: Limit to 50 results
    searchQuery = searchQuery.limit(50);

    const { data: rawMessages, error: searchError } = await searchQuery;

    if (searchError) {
      console.error('[searchMessages] Search error:', searchError);
      return { error: 'Failed to search messages' };
    }

    console.log('[searchMessages] Found', rawMessages?.length || 0, 'raw results');

    // Debug: Filter results to only rooms user has access to (via RLS we only get accessible rooms)
    // Additional check: verify user is participant
    const messageIds = rawMessages?.map(m => m.id) || [];

    if (messageIds.length === 0) {
      console.log('[searchMessages] No messages found');
      return {
        success: true,
        results: [],
      };
    }

    // Debug: Verify user has access to these chat rooms
    const roomIds = [...new Set(rawMessages?.map(m => m.chat_room_id) || [])];

    const { data: accessibleRooms, error: accessError } = await supabase
      .from('chat_participants')
      .select('chat_room_id')
      .eq('user_id', userId)
      .in('chat_room_id', roomIds);

    if (accessError) {
      console.error('[searchMessages] Error checking room access:', accessError);
      return { error: 'Failed to verify room access' };
    }

    const accessibleRoomIds = new Set(accessibleRooms?.map(r => r.chat_room_id) || []);

    console.log('[searchMessages] User has access to', accessibleRoomIds.size, 'of', roomIds.length, 'rooms');

    // Debug: Filter messages to only accessible rooms
    const accessibleMessages = rawMessages?.filter(m => accessibleRoomIds.has(m.chat_room_id)) || [];

    console.log('[searchMessages] Filtered to', accessibleMessages.length, 'accessible messages');

    // Debug: Calculate relevance rank using ts_rank for ordering
    // We'll do this in memory since Supabase JS doesn't support ts_rank directly
    // For now, we'll order by created_at DESC
    const sortedMessages = accessibleMessages.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Debug: Format results with content snippets
    const results: MessageSearchResult[] = sortedMessages.map((message: any) => {
      // Create snippet with highlighted match
      const content = message.content || '';
      const queryWords = data.query.toLowerCase().split(/\s+/);

      // Find first matching word position
      let snippetStart = 0;
      for (const word of queryWords) {
        const pos = content.toLowerCase().indexOf(word);
        if (pos !== -1) {
          snippetStart = Math.max(0, pos - 50);
          break;
        }
      }

      // Extract snippet (max 200 chars)
      const snippetEnd = Math.min(content.length, snippetStart + 200);
      let snippet = content.substring(snippetStart, snippetEnd);

      // Add ellipsis if truncated
      if (snippetStart > 0) snippet = '...' + snippet;
      if (snippetEnd < content.length) snippet = snippet + '...';

      // Debug: Highlight matching words in snippet
      queryWords.forEach(word => {
        if (word.length > 2) {
          const regex = new RegExp(`(${word})`, 'gi');
          snippet = snippet.replace(regex, '<mark>$1</mark>');
        }
      });

      return {
        id: message.id,
        content: message.content,
        snippet,
        sender: {
          id: message.sender?.id || '',
          name: message.sender?.name || 'Unknown User',
          avatar_url: message.sender?.avatar_url || null,
        },
        chatRoom: {
          id: message.chat_room?.id || '',
          name: message.chat_room?.name || 'Unknown Room',
          type: message.chat_room?.type || 'project',
          project_id: message.chat_room?.project_id || null,
        },
        created_at: message.created_at,
        // Include entity references for context
        entityReferences: message.entity_references || [],
      };
    });

    console.log('[searchMessages] Returning', results.length, 'search results');

    return {
      success: true,
      results,
      query: data.query,
    };
  } catch (error) {
    console.error('[searchMessages] Unexpected error:', error);
    return { error: 'An unexpected error occurred during search' };
  }
}
