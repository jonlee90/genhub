'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  searchProjects,
  searchTasks,
  searchMaterials,
  searchExpenses,
  searchUsers,
  type ProjectSearchResult,
  type TaskSearchResult,
  type MaterialSearchResult,
  type ExpenseSearchResult,
  type UserSearchResult,
} from '@/app/actions/chat-search';
import {
  Building2,
  ClipboardCheck,
  Hammer,
  DollarSign,
  User as UserIcon,
  Loader2,
  Search,
} from 'lucide-react';
import type { EntityType } from '@/types/chat.types';

// Debug: Entity type definitions for autocomplete
const ENTITY_TYPES = [
  { type: 'project' as EntityType, prefix: '@project:', label: 'Project', icon: Building2, color: 'text-construction-blue' },
  { type: 'task' as EntityType, prefix: '@task:', label: 'Task', icon: ClipboardCheck, color: 'text-construction-blue' },
  { type: 'material' as EntityType, prefix: '@material:', label: 'Material', icon: Hammer, color: 'text-construction-accent' },
  { type: 'expense' as EntityType, prefix: '@expense:', label: 'Expense', icon: DollarSign, color: 'text-construction-green' },
  { type: 'user' as EntityType, prefix: '@', label: 'User', icon: UserIcon, color: 'text-construction-blue' },
] as const;

// Debug: Search result type union
type SearchResultType =
  | (ProjectSearchResult & { type: 'project' })
  | (TaskSearchResult & { type: 'task' })
  | (MaterialSearchResult & { type: 'material' })
  | (ExpenseSearchResult & { type: 'expense' })
  | (UserSearchResult & { type: 'user' });

interface EntityAutocompleteProps {
  query: string; // The text after @ trigger
  position: { x: number; y: number };
  chatRoomId: string;
  onSelect: (entity: { type: EntityType; id: string; displayName: string }) => void;
  onClose: () => void;
}

// Debug: Autocomplete dropdown for entity mentions
export function EntityAutocomplete({
  query,
  position,
  chatRoomId,
  onSelect,
  onClose,
}: EntityAutocompleteProps) {
  const [results, setResults] = useState<SearchResultType[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeEntityType, setActiveEntityType] = useState<EntityType | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  console.log('[EntityAutocomplete] Rendering with query:', query, 'Position:', position);

  // Debug: Detect entity type from query
  useEffect(() => {
    const detectedType = detectEntityType(query);
    console.log('[EntityAutocomplete] Detected entity type:', detectedType);
    setActiveEntityType(detectedType);
  }, [query]);

  // Debug: Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!query || query.length === 0) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      console.log('[EntityAutocomplete] Searching for:', query);
      setIsLoading(true);

      try {
        const entityType = detectEntityType(query);
        const searchQuery = extractSearchQuery(query, entityType);

        console.log('[EntityAutocomplete] Entity type:', entityType, 'Search query:', searchQuery);

        if (searchQuery.length === 0) {
          setResults([]);
          setIsLoading(false);
          return;
        }

        let searchResults: SearchResultType[] = [];

        // Debug: Call appropriate search function based on entity type
        switch (entityType) {
          case 'project': {
            const result = await searchProjects(searchQuery);
            if (result.success) {
              searchResults = result.results.map(r => ({ ...r, type: 'project' as const }));
            }
            break;
          }
          case 'task': {
            const result = await searchTasks(searchQuery);
            if (result.success) {
              searchResults = result.results.map(r => ({ ...r, type: 'task' as const }));
            }
            break;
          }
          case 'material': {
            const result = await searchMaterials(searchQuery);
            if (result.success) {
              searchResults = result.results.map(r => ({ ...r, type: 'material' as const }));
            }
            break;
          }
          case 'expense': {
            const result = await searchExpenses(searchQuery);
            if (result.success) {
              searchResults = result.results.map(r => ({ ...r, type: 'expense' as const }));
            }
            break;
          }
          case 'user': {
            const result = await searchUsers(searchQuery, chatRoomId);
            if (result.success) {
              searchResults = result.results.map(r => ({ ...r, type: 'user' as const }));
            }
            break;
          }
        }

        console.log('[EntityAutocomplete] Search results:', searchResults.length);
        setResults(searchResults.slice(0, 10)); // Max 10 results
        setSelectedIndex(0); // Reset selection
      } catch (error) {
        console.error('[EntityAutocomplete] Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(performSearch, 200);
    return () => clearTimeout(timeoutId);
  }, [query, chatRoomId]);

  // Debug: Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('[EntityAutocomplete] Key pressed:', e.key);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
        case 'Tab':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, onClose]);

  // Debug: Auto-scroll selected item into view
  useEffect(() => {
    const selectedElement = dropdownRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  // Debug: Handle entity selection
  const handleSelect = (result: SearchResultType) => {
    console.log('[EntityAutocomplete] Selected:', result);

    const displayName = getDisplayName(result);

    onSelect({
      type: result.type,
      id: result.id,
      displayName,
    });
  };

  // Debug: Show entity type filters if no specific type detected
  const showTypeFilters = !activeEntityType || query.length === 0;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'absolute z-50 w-80 bg-white border-2 border-construction-blue rounded-lg shadow-2xl',
          'overflow-hidden'
        )}
        style={{
          top: position.y + 8,
          left: position.x,
        }}
      >
        {/* Debug: Header with search icon */}
        <div className="flex items-center gap-2 px-3 py-2 bg-construction-blue/5 border-b-2 border-construction-blue/10">
          <Search className="h-4 w-4 text-construction-blue" />
          <span className="text-xs font-mono font-black text-construction-blue uppercase tracking-wider">
            {showTypeFilters ? 'Select Type' : `Search ${activeEntityType}s`}
          </span>
        </div>

        {/* Debug: Entity type filters */}
        {showTypeFilters && (
          <div className="p-2 space-y-1">
            {ENTITY_TYPES.map((entityType, index) => (
              <button
                key={entityType.type}
                data-index={index}
                onClick={() => {
                  // Insert prefix into input (handled by parent)
                  console.log('[EntityAutocomplete] Entity type selected:', entityType.type);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all',
                  'hover:bg-construction-blue/10 border-2',
                  selectedIndex === index
                    ? 'bg-construction-blue/10 border-construction-blue/30'
                    : 'border-transparent'
                )}
              >
                <div className={cn('p-1.5 rounded-md bg-white border-2 border-gray-200')}>
                  <entityType.icon className={cn('h-4 w-4', entityType.color)} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-construction-blue">{entityType.label}</div>
                  <div className="text-[10px] font-mono text-gray-500">{entityType.prefix}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Debug: Search results */}
        {!showTypeFilters && (
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-construction-blue" />
                <span className="text-sm font-mono text-gray-500">SEARCHING...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-mono text-gray-500">No results found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {results.map((result, index) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    index={index}
                    isSelected={index === selectedIndex}
                    onClick={() => handleSelect(result)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Debug: Footer hint */}
        <div className="px-3 py-2 bg-gray-50 border-t-2 border-gray-100 flex items-center justify-between">
          <span className="text-[10px] font-mono text-gray-500">
            <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-[9px]">↑↓</kbd> Navigate
          </span>
          <span className="text-[10px] font-mono text-gray-500">
            <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-[9px]">ENTER</kbd> Select
          </span>
          <span className="text-[10px] font-mono text-gray-500">
            <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-[9px]">ESC</kbd> Close
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Debug: Search result item component
function SearchResultItem({
  result,
  index,
  isSelected,
  onClick,
}: {
  result: SearchResultType;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const entityConfig = ENTITY_TYPES.find(t => t.type === result.type);
  const Icon = entityConfig?.icon || Building2;

  return (
    <button
      data-index={index}
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-2.5 rounded-md transition-all border-2',
        'text-left',
        isSelected
          ? 'bg-construction-blue text-white border-construction-blue'
          : 'hover:bg-construction-blue/5 border-transparent'
      )}
    >
      <div
        className={cn(
          'p-1.5 rounded-md shrink-0',
          isSelected ? 'bg-white/20' : 'bg-white border-2 border-gray-200'
        )}
      >
        <Icon className={cn('h-4 w-4', isSelected ? 'text-white' : entityConfig?.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className={cn('text-sm font-bold truncate', isSelected ? 'text-white' : 'text-construction-blue')}>
          {getDisplayName(result)}
        </div>
        <div className={cn('text-xs truncate', isSelected ? 'text-white/80' : 'text-gray-600')}>
          {getSecondaryText(result)}
        </div>
      </div>
    </button>
  );
}

// Debug: Helper functions

function detectEntityType(query: string): EntityType | null {
  if (query.startsWith('project:')) return 'project';
  if (query.startsWith('task:')) return 'task';
  if (query.startsWith('material:')) return 'material';
  if (query.startsWith('expense:')) return 'expense';
  // Default to user mention if no prefix
  return 'user';
}

function extractSearchQuery(query: string, entityType: EntityType | null): string {
  if (!entityType || entityType === 'user') return query;

  const prefixes: Record<EntityType, string> = {
    project: 'project:',
    task: 'task:',
    material: 'material:',
    expense: 'expense:',
    user: '',
  };

  const prefix = prefixes[entityType];
  if (query.startsWith(prefix)) {
    return query.slice(prefix.length);
  }

  return query;
}

function getDisplayName(result: SearchResultType): string {
  switch (result.type) {
    case 'project':
      return result.name;
    case 'task':
      return result.title;
    case 'material':
      return result.product_name;
    case 'expense':
      return result.description;
    case 'user':
      return result.name;
  }
}

function getSecondaryText(result: SearchResultType): string {
  switch (result.type) {
    case 'project':
      return `${result.status} • Health: ${result.health_score}%`;
    case 'task':
      return `${result.status}${result.priority ? ` • ${result.priority}` : ''}`;
    case 'material':
      return `$${result.unit_price.toFixed(2)}${result.stock_status ? ` • ${result.stock_status}` : ''}`;
    case 'expense':
      return `$${result.amount.toFixed(2)} • ${result.status}`;
    case 'user':
      return result.email;
  }
}
