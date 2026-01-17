"use client";

import { memo, useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Check,
  ChevronsUpDown,
  X,
  Users,
  Building2,
  Plus,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BaseModal } from "@/components/ui/BaseModal";
import type { VendorOption } from "@/app/actions/expenses";

/**
 * Props for VendorCombobox component
 */
export interface VendorComboboxProps {
  /** Available vendor options */
  options: VendorOption[];
  /** Currently selected vendor name */
  value: string;
  /** Callback when vendor selection changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the combobox is disabled */
  disabled?: boolean;
  /** Whether options are loading */
  loading?: boolean;
  /** Error message if options failed to load */
  error?: string | null;
}

interface OptionRowProps {
  option: VendorOption;
  isSelected: boolean;
  onSelect: (option: VendorOption) => void;
}

const OptionRow = memo(function OptionRow({
  option,
  isSelected,
  onSelect,
}: OptionRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option)}
      className={cn(
        "w-full flex items-center gap-3 px-3",
        "min-h-[48px] py-2",
        "text-left transition-all duration-150",
        isSelected ? "bg-[#001B51]/5" : "bg-white hover:bg-gray-50",
        "active:bg-gray-100 active:scale-[0.99]",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0",
          option.type === "member" ? "bg-[#001B51]/10" : "bg-orange-100",
        )}
      >
        {option.type === "member" ? (
          <Users className="w-4 h-4 text-[#001B51]" />
        ) : (
          <Building2 className="w-4 h-4 text-orange-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 truncate">
          {option.name}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {option.type === "member" ? "Team Member" : "Subcontractor"}
        </div>
      </div>
      {isSelected && <Check className="w-4 h-4 text-[#001B51] flex-shrink-0" />}
    </button>
  );
});

interface CustomEntryRowProps {
  searchText: string;
  onSelect: (value: string) => void;
}

const CustomEntryRow = memo(function CustomEntryRow({
  searchText,
  onSelect,
}: CustomEntryRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(searchText)}
      className={cn(
        "w-full flex items-center gap-3 px-3",
        "min-h-[48px] py-2",
        "text-left transition-all duration-150",
        "bg-white hover:bg-gray-50 active:bg-gray-100",
        "border-t border-gray-100",
      )}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 flex-shrink-0">
        <Plus className="w-4 h-4 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 truncate">
          Use "{searchText}"
        </div>
        <div className="text-xs text-gray-500">Custom vendor</div>
      </div>
    </button>
  );
});

/**
 * VendorCombobox - Hybrid combobox for vendor selection
 *
 * Features:
 * - Grouped options: Team Members / Subcontractors
 * - Desktop: Popover with Command for filtering
 * - Mobile: Bottom sheet modal with search
 * - Custom entry option for typed text
 * - 48px row height, 44px minimum touch targets
 * - Debounced filter input (150ms)
 */
export function VendorCombobox({
  options,
  value,
  onChange,
  placeholder = "Select or enter vendor...",
  disabled = false,
  loading = false,
  error = null,
}: VendorComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Check if mobile (simple check - could use a hook for more robust detection)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchValue]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!debouncedSearch) return options;
    const search = debouncedSearch.toLowerCase();
    return options.filter(
      (opt) =>
        opt.name.toLowerCase().includes(search) ||
        opt.displayName.toLowerCase().includes(search),
    );
  }, [options, debouncedSearch]);

  // Group options by type
  const groupedOptions = useMemo(() => {
    const members = filteredOptions.filter((opt) => opt.type === "member");
    const subcontractors = filteredOptions.filter(
      (opt) => opt.type === "subcontractor",
    );
    return { members, subcontractors };
  }, [filteredOptions]);

  // Check if current search matches any option
  const searchMatchesOption = useMemo(() => {
    if (!debouncedSearch) return true;
    const search = debouncedSearch.toLowerCase();
    return options.some(
      (opt) =>
        opt.name.toLowerCase() === search ||
        opt.displayName.toLowerCase() === search,
    );
  }, [options, debouncedSearch]);

  // Handle selection
  const handleSelect = useCallback(
    (selectedValue: string) => {
      onChange(selectedValue);
      setOpen(false);
      setSearchValue("");
    },
    [onChange],
  );

  // Handle clear
  const handleClear = useCallback(() => {
    onChange("");
    setSearchValue("");
  }, [onChange]);

  // Get display text for selected value
  const displayText = useMemo(() => {
    if (!value) return "";
    const option = options.find((opt) => opt.name === value);
    return option ? option.name : value;
  }, [value, options]);

  // Mobile: Use BaseModal as bottom sheet
  if (isMobile) {
    return (
      <div className="relative">
        {/* Trigger Button */}
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen(true)}
          className={cn(
            "w-full h-11 justify-between border-2",
            "active:scale-[0.99] transition-transform",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <span className={cn("truncate", !value && "text-gray-500")}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            ) : (
              displayText || placeholder
            )}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {value && !disabled && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    handleClear();
                  }
                }}
                className="p-1 rounded hover:bg-gray-200 active:scale-95 cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-400" />
              </div>
            )}
            <ChevronsUpDown className="w-4 h-4 text-gray-400" />
          </div>
        </Button>

        {/* Mobile Bottom Sheet Modal */}
        {open && (
          <BaseModal
            isOpen={open}
            onClose={() => {
              setOpen(false);
              setSearchValue("");
            }}
            icon={Users}
            title="Select Vendor"
            subtitle="Choose from team or enter custom"
            maxWidth="md"
          >
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search or enter name..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-10 h-12 text-base border-2"
                  autoFocus
                />
              </div>

              {/* Error State */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Options List */}
              <div className="max-h-[50vh] overflow-y-auto -mx-6">
                {/* Team Members Group */}
                {groupedOptions.members.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <Users className="w-3.5 h-3.5" />
                        Team Members
                      </div>
                    </div>
                    {groupedOptions.members.map((option) => (
                      <OptionRow
                        key={`member-${option.id}`}
                        option={option}
                        isSelected={value === option.name}
                        onSelect={(selectedOption) =>
                          handleSelect(selectedOption.name)
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Subcontractors Group */}
                {groupedOptions.subcontractors.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <Building2 className="w-3.5 h-3.5" />
                        Subcontractors
                      </div>
                    </div>
                    {groupedOptions.subcontractors.map((option) => (
                      <OptionRow
                        key={`sub-${option.id}`}
                        option={option}
                        isSelected={value === option.name}
                        onSelect={(selectedOption) =>
                          handleSelect(selectedOption.name)
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Custom Entry Option */}
                {debouncedSearch && !searchMatchesOption && (
                  <CustomEntryRow
                    searchText={debouncedSearch}
                    onSelect={handleSelect}
                  />
                )}

                {/* Empty State */}
                {filteredOptions.length === 0 && !debouncedSearch && (
                  <div className="py-8 text-center text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No vendors available</p>
                  </div>
                )}
              </div>
            </div>
          </BaseModal>
        )}
      </div>
    );
  }

  // Desktop: Use Popover with Command-like UI
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full h-11 justify-between border-2",
            "hover:bg-gray-50 transition-colors",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <span className={cn("truncate", !value && "text-gray-500")}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            ) : (
              displayText || placeholder
            )}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {value && !disabled && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    handleClear();
                  }
                }}
                className="p-1 rounded hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-400" />
              </div>
            )}
            <ChevronsUpDown className="w-4 h-4 text-gray-400" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <div className="space-y-0">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search or enter name..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-8 h-10 border-gray-200"
                autoFocus
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-2 m-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto">
            {/* Team Members Group */}
            {groupedOptions.members.length > 0 && (
              <div>
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 sticky top-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    <Users className="w-3 h-3" />
                    Team Members
                  </div>
                </div>
                {groupedOptions.members.map((option) => (
                  <OptionRow
                    key={`member-${option.id}`}
                    option={option}
                    isSelected={value === option.name}
                    onSelect={(selectedOption) =>
                      handleSelect(selectedOption.name)
                    }
                  />
                ))}
              </div>
            )}

            {/* Subcontractors Group */}
            {groupedOptions.subcontractors.length > 0 && (
              <div>
                <div className="px-3 py-1.5 bg-gray-50 border-y border-gray-100 sticky top-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    <Building2 className="w-3 h-3" />
                    Subcontractors
                  </div>
                </div>
                {groupedOptions.subcontractors.map((option) => (
                  <OptionRow
                    key={`sub-${option.id}`}
                    option={option}
                    isSelected={value === option.name}
                    onSelect={(selectedOption) =>
                      handleSelect(selectedOption.name)
                    }
                  />
                ))}
              </div>
            )}

            {/* Custom Entry Option */}
            {debouncedSearch && !searchMatchesOption && (
              <CustomEntryRow
                searchText={debouncedSearch}
                onSelect={handleSelect}
              />
            )}

            {/* Empty State */}
            {filteredOptions.length === 0 && !debouncedSearch && (
              <div className="py-6 text-center text-gray-500">
                <Users className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                <p className="text-xs">No vendors available</p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
