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
    <div className="relative flex items-center gap-2 p-1 bg-gray-100 rounded-lg border-2 border-gray-200 overflow-x-auto flex-nowrap scrollbar-hide scroll-smooth">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative z-10 px-4 py-2 text-sm font-bold transition-colors duration-200 rounded-md flex-shrink-0",
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
                "ml-1 px-1.5 py-0.5 text-xs font-black rounded-full",
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
              style={{ zIndex: -1 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
