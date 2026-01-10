'use client';

import { Receipt, Clock, CheckCircle, Tag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ExpenseSummaryProps {
  analytics: {
    totalCount: number;
    totalAmount: number;
    pendingCount: number;
    pendingAmount: number;
    approvedCount: number;
    approvedAmount: number;
    rejectedCount: number;
    rejectedAmount: number;
    byCategory: { category: string; amount: number; count: number }[];
  } | null;
  isLoading?: boolean;
}

/**
 * ExpenseSummary Component
 *
 * Displays 4-card summary grid for expenses dashboard:
 * 1. Total Expenses (count + amount)
 * 2. Pending Approval (count + amount with warning color)
 * 3. Approved (count + amount with success color)
 * 4. Top Categories (top 3 categories)
 *
 * Pattern: Follows MaterialSummary card grid layout
 *
 * @component
 */
export function ExpenseSummary({ analytics, isLoading = false }: ExpenseSummaryProps) {
  // Format amount as USD with comma separators
  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get top 3 categories
  const topCategories = analytics?.byCategory.slice(0, 3) || [];

  // Capitalize category name
  const formatCategory = (category: string): string => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border-2 border-gray-200 rounded-lg p-4 shadow-construction">
            <div className="flex items-start gap-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-6 text-center text-gray-500">
        Unable to load expense summary
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Expenses */}
      <div className="border-2 border-gray-200 rounded-lg p-4 shadow-construction hover:scale-105 transition-transform bg-gradient-to-br from-blue-50/50 to-white">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#001B51] rounded-lg">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Total Expenses
            </p>
            <p className="text-2xl font-black text-gray-900">
              {analytics.totalCount}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {formatCurrency(analytics.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Card 2: Pending Approval */}
      <div className="border-2 border-gray-200 rounded-lg p-4 shadow-construction hover:scale-105 transition-transform bg-gradient-to-br from-amber-50/50 to-white">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#F59E0B] rounded-lg">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Pending Approval
            </p>
            <p className="text-2xl font-black text-gray-900">
              {analytics.pendingCount}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {formatCurrency(analytics.pendingAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Card 3: Approved */}
      <div className="border-2 border-gray-200 rounded-lg p-4 shadow-construction hover:scale-105 transition-transform bg-gradient-to-br from-green-50/50 to-white">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#059669] rounded-lg">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Approved
            </p>
            <p className="text-2xl font-black text-gray-900">
              {analytics.approvedCount}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {formatCurrency(analytics.approvedAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Card 4: Top Categories */}
      <div className="border-2 border-gray-200 rounded-lg p-4 shadow-construction hover:scale-105 transition-transform bg-gradient-to-br from-gray-50/50 to-white">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#3C3C3C] rounded-lg">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Top Categories
            </p>
            {topCategories.length > 0 ? (
              <div className="space-y-1">
                {topCategories.map((cat, index) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <span className="text-xs text-gray-700 truncate max-w-[80px]">
                      {index + 1}. {formatCategory(cat.category)}
                    </span>
                    <span className="text-xs font-medium text-gray-900">
                      {cat.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
