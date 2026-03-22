"use client";

import { Badge } from "@/components/ui/badge";
import Clock from "lucide-react/icons/clock";
import TrendingUp from "lucide-react/icons/trending-up";
import TrendingDown from "lucide-react/icons/trending-down";

type EstimateVersion = {
  id: string;
  version: number;
  createdAt: string;
  createdBy: string;
  totalCost: number;
  changeDescription: string;
  costDelta?: number;
};

type EstimateHistoryListProps = {
  estimateId: string;
};

// Mock history data (would fetch from API in real implementation)
const mockHistory: EstimateVersion[] = [
  {
    id: "v3",
    version: 3,
    createdAt: "2026-02-08T14:30:00Z",
    createdBy: "John Doe",
    totalCost: 85000,
    changeDescription: "Updated labor costs for framing",
    costDelta: 2500,
  },
  {
    id: "v2",
    version: 2,
    createdAt: "2026-02-07T10:15:00Z",
    createdBy: "Jane Smith",
    totalCost: 82500,
    changeDescription: "Added electrical rough-in items",
    costDelta: 12500,
  },
  {
    id: "v1",
    version: 1,
    createdAt: "2026-02-06T16:45:00Z",
    createdBy: "John Doe",
    totalCost: 70000,
    changeDescription: "Initial estimate created",
  },
];

export function EstimateHistoryList({ estimateId }: EstimateHistoryListProps) {
  return (
    <div className="space-y-3">
      {mockHistory.map((version, index) => {
        const isLatest = index === 0;

        return (
          <div
            key={version.id}
            className="relative p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            {/* Timeline connector */}
            {index < mockHistory.length - 1 ? (
              <div className="absolute left-[22px] top-[52px] w-[2px] h-[calc(100%+12px)] bg-gray-200 dark:bg-gray-700" />
            ) : null}

            <div className="flex items-start gap-4">
              {/* Timeline dot */}
              <div
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isLatest
                    ? "bg-construction-blue"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <Clock
                  className={`w-3 h-3 ${isLatest ? "text-white" : "text-gray-600 dark:text-gray-400"}`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        Version {version.version}
                      </h4>
                      {isLatest ? (
                        <Badge
                          variant="outline"
                          className="text-xs border-construction-blue text-construction-blue dark:text-construction-blue"
                        >
                          Current
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {version.createdBy} •{" "}
                      {new Date(version.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      ${version.totalCost.toLocaleString()}
                    </p>
                    {version.costDelta ? (
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          version.costDelta > 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {version.costDelta > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {version.costDelta > 0 ? "+" : ""}$
                          {Math.abs(version.costDelta).toLocaleString()}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {version.changeDescription}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
