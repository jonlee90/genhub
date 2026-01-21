'use client';

import { useState, useMemo } from 'react';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import MapPin from 'lucide-react/icons/map-pin';
import Plus from 'lucide-react/icons/plus';
import ChevronDown from 'lucide-react/icons/chevron-down';
import ChevronRight from 'lucide-react/icons/chevron-right';
import AlertCircle from 'lucide-react/icons/alert-circle';
import CheckCircle2 from 'lucide-react/icons/check-circle-2';
import Clock from 'lucide-react/icons/clock';
import MessageSquare from 'lucide-react/icons/message-square';
import Filter from 'lucide-react/icons/filter';
import Search from 'lucide-react/icons/search';
import X from 'lucide-react/icons/x';;
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface Marker {
  id: string;
  title: string;
  description?: string;
  category: 'issue' | 'note' | 'task' | 'approval';
  status: 'open' | 'in-progress' | 'resolved';
  position: { x: number; y: number; z: number };
  createdAt: string;
  assignedTask?: string;
  commentCount?: number;
}

export interface MarkerAnnotationPanelProps {
  markers: Marker[];
  onAddMarker?: () => void;
  onMarkerClick?: (markerId: string) => void;
  onFilterChange?: (category: string | null) => void;
  className?: string;
}

export function MarkerAnnotationPanel({
  markers,
  onAddMarker,
  onMarkerClick,
  onFilterChange,
  className,
}: MarkerAnnotationPanelProps) {
  console.log('[MarkerAnnotationPanel] Rendering', { markerCount: markers.length });

  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getCategoryIcon = (category: Marker['category']) => {
    switch (category) {
      case 'issue':
        return AlertCircle;
      case 'note':
        return MessageSquare;
      case 'task':
        return CheckCircle2;
      case 'approval':
        return Clock;
    }
  };

  const getCategoryColor = (category: Marker['category']) => {
    switch (category) {
      case 'issue':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'note':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'task':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'approval':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  const getStatusColor = (status: Marker['status']) => {
    switch (status) {
      case 'open':
        return 'bg-gray-400 text-white';
      case 'in-progress':
        return 'bg-[#FBBF24] text-gray-900';
      case 'resolved':
        return 'bg-[#059669] text-white';
    }
  };

  // Performance optimization: Memoize filtered markers to avoid recalculation on every render
  const filteredMarkers = useMemo(() =>
    markers.filter((marker) => {
      const matchesSearch = marker.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        marker.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || marker.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
  , [markers, searchQuery, selectedCategory]);

  // Performance optimization: Memoize category counts computed via reduce
  const categoryCounts = useMemo(() =>
    markers.reduce(
      (acc, marker) => {
        acc[marker.category] = (acc[marker.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    )
  , [markers]);

  const categories = [
    { id: 'issue', label: 'Issues', icon: AlertCircle },
    { id: 'task', label: 'Tasks', icon: CheckCircle2 },
    { id: 'note', label: 'Notes', icon: MessageSquare },
    { id: 'approval', label: 'Approvals', icon: Clock },
  ];

  return (
    <Card
      className={cn(
        'border-2 border-gray-200 shadow-construction overflow-hidden relative group',
        'bg-white',
        className
      )}
    >
      {/* Hover overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header */}
      <div className="border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-4 p-4 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-construction-blue rounded-lg">
              <MapPin className="h-4 w-4 text-white" />
            </div>

            <div className="text-left">
              <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider">
                Markers & Annotations
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{markers.length} total</p>
            </div>
          </div>

          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 relative">
          {/* Search & Add Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search markers..."
                className={cn(
                  'w-full pl-10 pr-8 py-2 rounded-lg',
                  'border-2 border-gray-200 focus:border-construction-blue focus:outline-none',
                  'text-sm placeholder:text-gray-400'
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>

            <button
              onClick={onAddMarker}
              className={cn(
                'px-4 py-2 rounded-lg font-semibold text-sm uppercase tracking-wide',
                'bg-construction-blue text-white border-2 border-construction-blue',
                'hover:bg-[#002666] transition-colors',
                'flex items-center gap-2 flex-shrink-0'
              )}
              title="Add Marker"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400" />
            {categories.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  const newCategory = selectedCategory === id ? null : id;
                  setSelectedCategory(newCategory);
                  onFilterChange?.(newCategory);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide',
                  'border-2 transition-all',
                  'flex items-center gap-1.5',
                  selectedCategory === id
                    ? 'bg-construction-blue text-white border-construction-blue'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-construction-blue'
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
                <Badge className="ml-1 bg-white/20 text-inherit px-1.5 py-0">
                  {categoryCounts[id] || 0}
                </Badge>
              </button>
            ))}
          </div>

          {/* Marker List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredMarkers.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {searchQuery || selectedCategory ? 'No matching markers' : 'No markers yet'}
                </p>
              </div>
            ) : (
              filteredMarkers.map((marker) => {
                const CategoryIcon = getCategoryIcon(marker.category);

                return (
                  <button
                    key={marker.id}
                    onClick={() => onMarkerClick?.(marker.id)}
                    className={cn(
                      'w-full p-3 rounded-lg border-2 text-left',
                      'hover:border-construction-blue hover:bg-blue-50/30 transition-all',
                      'group'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-lg border-2 flex-shrink-0',
                          getCategoryColor(marker.category)
                        )}
                      >
                        <CategoryIcon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-gray-900 group-hover:text-construction-blue transition-colors">
                            {marker.title}
                          </h4>
                          <Badge className={cn('text-xs px-2 py-0.5', getStatusColor(marker.status))}>
                            {marker.status}
                          </Badge>
                        </div>

                        {marker.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {marker.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="font-mono">
                            {new Date(marker.createdAt).toLocaleDateString()}
                          </span>
                          {marker.commentCount !== undefined && marker.commentCount > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {marker.commentCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
