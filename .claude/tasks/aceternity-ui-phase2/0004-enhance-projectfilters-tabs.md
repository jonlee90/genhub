# Task 0004: Enhance ProjectFilters with Aceternity Tabs & Vanishing Input

**Priority**: MEDIUM
**Estimated Time**: 2 hours
**Component**: `components/projects/ProjectFilters.tsx`

## Objective
Transform project filters using Aceternity UI tabs for status filters and vanishing placeholder input for search, with smooth transitions and construction-themed styling.

## Current State
- Basic dropdown selects for status, type, sort
- Simple text input for search
- "Clear All" button
- Filter header with icon

## Target State (Aceternity UI)
- **Aceternity Tabs**: Animated status filter tabs (All, Active, On Hold, Completed)
- **Vanishing Placeholder Input**: Search input with rotating placeholder suggestions
- **Smooth Transitions**: Tab indicator slides smoothly between selections
- **Enhanced Dropdowns**: Type and sort dropdowns with construction styling
- **Clear Button**: Animated clear button with spring physics

## Implementation Steps

### 1. Create Aceternity Tabs Component

**File**: `components/ui/aceternity/tabs.tsx`

```typescript
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="relative flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative z-10 px-4 py-2 text-sm font-medium transition-colors duration-200",
            activeTab === tab.id
              ? "text-white"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <div className="flex items-center gap-2">
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={cn(
                "ml-1 px-1.5 py-0.5 text-xs rounded-full",
                activeTab === tab.id
                  ? "bg-white/20"
                  : "bg-gray-200"
              )}>
                {tab.count}
              </span>
            )}
          </div>

          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-r from-construction-blue to-blue-700 rounded-md shadow-construction"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
```

### 2. Create Vanishing Placeholder Input

**File**: `components/ui/aceternity/placeholders-vanish-input.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface VanishInputProps {
  placeholders: string[];
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export function PlaceholdersVanishInput({
  placeholders,
  value,
  onChange,
  onClear,
}: VanishInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  // Rotate placeholders every 3 seconds
  useEffect(() => {
    if (isFocused || value) return;

    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isFocused, value, placeholders.length]);

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none" />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-construction-blue focus:outline-none transition-colors"
        />

        {/* Animated placeholder */}
        {!value && !isFocused && (
          <div className="absolute left-10 pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.span
                key={placeholderIndex}
                className="text-gray-400 text-sm"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {placeholders[placeholderIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        )}

        {/* Clear button */}
        <AnimatePresence>
          {value && (
            <motion.button
              className="absolute right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
              onClick={onClear}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <X className="w-4 h-4 text-gray-500" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

### 3. Update ProjectFilters Component

**File**: `components/projects/ProjectFilters.tsx`

```typescript
import { Tabs } from "@/components/ui/aceternity/tabs";
import { PlaceholdersVanishInput } from "@/components/ui/aceternity/placeholders-vanish-input";
import { Filter, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

// Status tabs
const statusTabs = [
  { id: "all", label: "All Projects", count: totalProjects },
  { id: "active", label: "Active", count: activeCount },
  { id: "on_hold", label: "On Hold", count: onHoldCount },
  { id: "completed", label: "Completed", count: completedCount },
];

// Search placeholders
const searchPlaceholders = [
  "Search projects...",
  "Find by name...",
  "Search by client...",
  "Filter by address...",
];

return (
  <div className="space-y-4">
    {/* Filter header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-construction-blue" />
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>

      {/* Clear all button */}
      {hasActiveFilters && (
        <motion.button
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-construction-blue hover:bg-construction-blue/10 rounded-lg transition-colors"
          onClick={clearAllFilters}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw className="w-4 h-4" />
          Clear All
        </motion.button>
      )}
    </div>

    {/* Status tabs */}
    <Tabs
      tabs={statusTabs}
      activeTab={filters.status}
      onChange={(status) => setFilters({ ...filters, status })}
    />

    {/* Search & dropdowns */}
    <div className="flex flex-wrap items-center gap-3">
      {/* Search input with vanishing placeholders */}
      <div className="flex-1 min-w-[250px]">
        <PlaceholdersVanishInput
          placeholders={searchPlaceholders}
          value={filters.search}
          onChange={(search) => setFilters({ ...filters, search })}
          onClear={() => setFilters({ ...filters, search: "" })}
        />
      </div>

      {/* Project type dropdown */}
      <select
        value={filters.type}
        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        className="px-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg focus:border-construction-blue focus:outline-none transition-colors cursor-pointer hover:bg-gray-50"
      >
        <option value="all">All Types</option>
        <option value="residential">🏠 Residential</option>
        <option value="restaurant_cafe">☕ Restaurant/Cafe</option>
        <option value="commercial_office">🏢 Commercial</option>
        <option value="industrial">🏭 Industrial</option>
      </select>

      {/* Sort dropdown */}
      <select
        value={filters.sort}
        onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
        className="px-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg focus:border-construction-blue focus:outline-none transition-colors cursor-pointer hover:bg-gray-50"
      >
        <option value="name">Sort by Name</option>
        <option value="status">Sort by Status</option>
        <option value="health">Sort by Health</option>
        <option value="date">Sort by Date</option>
      </select>
    </div>

    {/* Active filter badges */}
    {hasActiveFilters && (
      <motion.div
        className="flex flex-wrap gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {filters.type !== "all" && (
          <FilterBadge
            label={`Type: ${filters.type}`}
            onRemove={() => setFilters({ ...filters, type: "all" })}
          />
        )}
        {filters.search && (
          <FilterBadge
            label={`Search: "${filters.search}"`}
            onRemove={() => setFilters({ ...filters, search: "" })}
          />
        )}
      </motion.div>
    )}
  </div>
);

// Filter badge component
function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-1 bg-construction-blue/10 text-construction-blue text-sm font-medium rounded-full"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
    >
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="hover:bg-construction-blue/20 rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}
```

## Acceptance Criteria

- [ ] Status tabs slide smoothly between selections
- [ ] Active tab has gradient background with shadow
- [ ] Search placeholders rotate every 3 seconds
- [ ] Placeholder vanishes on focus/input
- [ ] Clear button appears with spring animation
- [ ] Dropdowns styled with construction theme
- [ ] Filter badges show active filters
- [ ] "Clear All" button appears when filters active
- [ ] All animations at 60fps

## Testing Checklist

- [ ] Tab indicator transitions smoothly (layoutId)
- [ ] Placeholder rotation works (3s interval)
- [ ] Search input clears with X button
- [ ] Dropdowns open/close properly
- [ ] Filter badges removable individually
- [ ] "Clear All" resets all filters
- [ ] Mobile: Filters stack vertically
- [ ] Keyboard: Tab navigation works

## Design Reference

**Aceternity UI Components**:
- [Tabs](https://ui.aceternity.com/components/tabs)
- [Placeholders and Vanish Input](https://ui.aceternity.com/components/placeholders-and-vanish-input)

**Animation Specs**:
- Tab transition: Spring (stiffness 300, damping 30)
- Placeholder: 300ms fade + slide
- Clear button: Spring animation with rotation
- Filter badges: Scale 0 → 1 spring

## Notes

- Tab layoutId: "activeTab" for smooth transition
- Placeholder rotation: 3s interval, pause on focus
- Construction theme: #001B51 for active states
- Dropdowns: Border-2 for consistency
- Mobile breakpoint: Stack filters at < 768px

---

**Status**: Pending
**Dependencies**: Task 0003 (PhaseStation)
**Next Task**: 0005 - CreateProjectForm Multi-Step Enhancement
