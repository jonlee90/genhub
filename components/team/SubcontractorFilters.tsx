'use client';

import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlaceholdersVanishInput } from '@/components/ui/aceternity/placeholders-vanish-input';
import type { SubcontractorsRow } from '@/types/db/tables/companies';
import type { TradeType } from '@/types/db/enums';

interface SubcontractorFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  tradeFilter: string;
  onTradeChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  subcontractors: SubcontractorsRow[];
  mobile?: boolean;
}

// Search placeholders
const searchPlaceholders = [
  'Search subcontractors...',
  'Find by company name...',
  'Search by contact...',
  'Filter by email...',
];

// Trade labels
const TRADE_LABELS: Record<TradeType, string> = {
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  hvac: 'HVAC',
  carpentry: 'Carpentry',
  masonry: 'Masonry',
  roofing: 'Roofing',
  flooring: 'Flooring',
  painting: 'Painting',
  drywall: 'Drywall',
  concrete: 'Concrete',
  landscaping: 'Landscaping',
  demolition: 'Demolition',
  steel_work: 'Steel Work',
  glass_glazing: 'Glass & Glazing',
  fire_protection: 'Fire Protection',
  insulation: 'Insulation',
  framing: 'Framing',
  general: 'General',
  other: 'Other',
};

// Sort labels
const SORT_LABELS: Record<string, string> = {
  name: 'Name (A-Z)',
  rating: 'Rating (High-Low)',
  recent: 'Recently Added',
  trade: 'Trade Type',
};

export function SubcontractorFilters({
  searchQuery,
  onSearchChange,
  tradeFilter,
  onTradeChange,
  sortBy,
  onSortChange,
  subcontractors,
  mobile = false,
}: SubcontractorFiltersProps) {
  // Get unique trades from subcontractors
  const availableTrades = useMemo(() => {
    const trades = new Set<TradeType>();
    subcontractors.forEach((sub) => {
      if (sub.trade_specialization) {
        trades.add(sub.trade_specialization);
      }
    });
    return Array.from(trades).sort((a, b) => TRADE_LABELS[a].localeCompare(TRADE_LABELS[b]));
  }, [subcontractors]);

  if (mobile) {
    return (
      <div className="space-y-3 mb-4">
        {/* Search input */}
        <PlaceholdersVanishInput
          placeholders={searchPlaceholders}
          value={searchQuery}
          onChange={onSearchChange}
          onClear={() => onSearchChange('')}
        />

        {/* Filter dropdowns in a scrollable row */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {/* Trade filter */}
          <Select value={tradeFilter} onValueChange={onTradeChange}>
            <SelectTrigger className="w-[140px] h-11 flex-shrink-0 border-2 border-gray-200 dark:border-gray-700 font-bold hover:border-construction-blue/50 dark:hover:border-construction-blue/70 transition-colors dark:bg-gray-900 dark:text-gray-100">
              <SelectValue placeholder="Trade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="font-medium">All Trades</span>
              </SelectItem>
              {availableTrades.map((trade) => (
                <SelectItem key={trade} value={trade}>
                  <span className="font-medium">{TRADE_LABELS[trade]}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort dropdown */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[140px] h-11 flex-shrink-0 border-2 border-gray-200 dark:border-gray-700 font-bold hover:border-construction-blue/50 dark:hover:border-construction-blue/70 transition-colors dark:bg-gray-900 dark:text-gray-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  <span className="font-medium">{label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="space-y-4 mb-3">
      {/* Search input */}
      <div className="flex-1 min-w-[280px]">
        <PlaceholdersVanishInput
          placeholders={searchPlaceholders}
          value={searchQuery}
          onChange={onSearchChange}
          onClear={() => onSearchChange('')}
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Trade filter */}
        <Select value={tradeFilter} onValueChange={onTradeChange}>
          <SelectTrigger className="w-full md:w-[200px] h-11 border-2 border-gray-200 dark:border-gray-700 font-bold hover:border-construction-blue/50 dark:hover:border-construction-blue/70 transition-colors dark:bg-gray-900 dark:text-gray-100">
            <SelectValue placeholder="Trade Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="font-medium">All Trades</span>
            </SelectItem>
            {availableTrades.map((trade) => (
              <SelectItem key={trade} value={trade}>
                <span className="font-medium">{TRADE_LABELS[trade]}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort dropdown */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full md:w-[180px] h-11 border-2 border-gray-200 dark:border-gray-700 font-bold hover:border-construction-blue/50 dark:hover:border-construction-blue/70 transition-colors dark:bg-gray-900 dark:text-gray-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                <span className="font-medium">{label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
