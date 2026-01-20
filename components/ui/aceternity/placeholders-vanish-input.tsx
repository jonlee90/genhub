"use client";

import { useState, useEffect } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
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
          className="w-full pl-10 pr-10 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg focus:border-construction-blue focus:outline-none transition-colors bg-white"
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
              type="button"
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
