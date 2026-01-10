'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * InfoCard field configuration
 * Supports various display types: progress bars, badges, links, and regular fields
 */
export interface InfoCardField {
  label: string;
  value: string | number | ReactNode;
  icon?: LucideIcon;
  href?: string;
  hrefType?: 'email' | 'tel' | 'link';
  show?: boolean; // Conditional rendering
  isProgressBar?: boolean;
  progressValue?: number;
  progressColor?: string;
  isBadge?: boolean;
  badgeColor?: string;
  className?: string;
}

/**
 * InfoCard component props
 */
export interface InfoCardProps {
  headerIcon?: LucideIcon; // Optional when customHeader is provided
  headerTitle: string;
  headerDescription: string;
  fields: InfoCardField[];
  columns?: 1 | 2 | 3 | 4; // Column layout (default: 1)
  footerContent?: ReactNode;
  className?: string;
  customHeader?: ReactNode; // Optional custom header to override default
  isHeroCard?: boolean; // Larger header styling for title sections
}

/**
 * Reusable InfoCard component for displaying structured information
 * with consistent construction-themed styling and flexible column layouts.
 *
 * Features:
 * - Supports 1-4 column layouts with responsive behavior
 * - Progress bars, badges, and custom content
 * - Hover effects and smooth animations
 * - Interactive fields (email, phone, links)
 * - Conditional field rendering
 */
export function InfoCard({
  headerIcon: HeaderIcon,
  headerTitle,
  headerDescription,
  fields,
  columns = 1,
  footerContent,
  className,
  customHeader,
  isHeroCard = false,
}: InfoCardProps) {
  // Debug logging for responsive layout
  console.log('[InfoCard] Rendering:', {
    title: headerTitle,
    columns,
    fieldsCount: fields.length,
    // Mobile: 2-col, Desktop: expands based on columns prop
    gridLayout: columns > 1 ? `mobile:2-col, desktop:${columns === 2 ? 4 : columns}-col` : 'single-col',
  });

  // Filter out fields where show === false
  const visibleFields = fields.filter(field => field.show !== false);

  // Responsive grid classes based on column count
  // Mobile-first: 2 columns on mobile (< md), expanding on desktop
  // Progress bars use col-span-full to remain full-width at all breakpoints
  const gridClasses = {
    1: '',
    2: 'grid grid-cols-2 gap-x-3 gap-y-3 md:grid-cols-4 md:gap-x-6 md:gap-y-4',
    3: 'grid grid-cols-2 gap-x-3 gap-y-3 md:grid-cols-3 md:gap-x-8 md:gap-y-6',
    4: 'grid grid-cols-2 gap-x-3 gap-y-3 md:grid-cols-4 md:gap-x-6 md:gap-y-4',
  };

  return (
    <Card className={cn(
      "border-2 border-gray-200 shadow-construction relative overflow-hidden group",
      className
    )}>
      {/* Hover overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header */}
      {customHeader ? (
        <CardHeader className={cn(
          "border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white relative",
          isHeroCard ? "p-6 md:p-8" : "p-4"
        )}>
          {customHeader}
        </CardHeader>
      ) : (
        <CardHeader className={cn(
          "border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white relative",
          isHeroCard && "pb-4"
        )}>
          <div className="flex items-center gap-3">
            {HeaderIcon && (
              <div className={cn(
                "p-2 bg-[#001B51] rounded-lg",
                isHeroCard && "p-3"
              )}>
                <HeaderIcon className={cn(
                  "h-4 w-4 text-white",
                  isHeroCard && "h-6 w-6"
                )} />
              </div>
            )}
            <div>
              <CardTitle className={cn(
                "text-sm font-black text-gray-700 uppercase tracking-wider",
                isHeroCard && "text-2xl md:text-3xl text-construction-blue normal-case tracking-tight"
              )}>
                {headerTitle}
              </CardTitle>
              <p className={cn(
                "text-xs text-gray-500 mt-0.5",
                isHeroCard && "text-sm text-gray-600 mt-1"
              )}>{headerDescription}</p>
            </div>
          </div>
        </CardHeader>
      )}

      {/* Content */}
      <CardContent className={cn(
        "relative",
        isHeroCard ? "p-6 md:p-8" : "p-4",
        columns > 1 ? gridClasses[columns] : 'space-y-4'
      )}>
        {visibleFields.map((field, index) => (
          <div key={index} className={cn(
            columns === 1 ? '' : 'space-y-2',
            field.className
          )}>
            {/* Field Label */}
            <div className={cn(
              "font-bold text-gray-500 uppercase tracking-wider",
              isHeroCard ? "text-xs md:text-sm mb-2" : "text-xs mb-1"
            )}>
              {field.label}
            </div>

            {/* Progress Bar */}
            {field.isProgressBar && typeof field.progressValue === 'number' && (
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex-1 bg-gray-200 rounded-full overflow-hidden",
                  isHeroCard ? "h-3" : "h-2"
                )}>
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      field.progressColor || 'bg-[#001B51]'
                    )}
                    style={{ width: `${field.progressValue}%` }}
                  />
                </div>
                <span className={cn(
                  "font-bold text-gray-900 min-w-[3ch] text-right",
                  isHeroCard ? "text-base md:text-lg" : "text-sm"
                )}>
                  {field.value}
                </span>
              </div>
            )}

            {/* Badge */}
            {field.isBadge && !field.isProgressBar && (
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 border border-gray-200",
                field.badgeColor
              )}>
                {field.icon && <field.icon className="h-4 w-4 flex-shrink-0" />}
                <span className="text-sm font-bold text-gray-900">
                  {field.value}
                </span>
              </div>
            )}

            {/* Interactive Link (email/phone/link) */}
            {field.href && !field.isProgressBar && !field.isBadge && (
              <a
                href={field.hrefType === 'email' ? `mailto:${field.href}` : field.hrefType === 'tel' ? `tel:${field.href}` : field.href}
                className={cn(
                  "flex items-center gap-2 font-bold text-[#001B51] hover:underline group/link",
                  isHeroCard ? "text-base md:text-lg" : "text-sm"
                )}
              >
                {field.icon && (
                  <field.icon className={cn(
                    "flex-shrink-0 group-hover/link:scale-110 transition-transform",
                    isHeroCard ? "h-5 w-5" : "h-4 w-4"
                  )} />
                )}
                <span className={field.hrefType === 'email' ? 'break-all' : ''}>
                  {field.value}
                </span>
              </a>
            )}

            {/* Regular Field */}
            {!field.href && !field.isProgressBar && !field.isBadge && (
              <div className={cn(
                "font-bold text-gray-900",
                isHeroCard ? "text-base md:text-lg" : "text-sm",
                field.icon && "flex items-center gap-2"
              )}>
                {field.icon && (
                  <field.icon className={cn(
                    "text-[#001B51] flex-shrink-0",
                    isHeroCard ? "h-5 w-5" : "h-4 w-4"
                  )} />
                )}
                <span>{field.value}</span>
              </div>
            )}
          </div>
        ))}

        {/* Footer Content */}
        {footerContent}
      </CardContent>
    </Card>
  );
}
