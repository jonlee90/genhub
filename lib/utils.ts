import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow as fnsFormatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

// ============================================
// Date Formatting Helpers (for ProjectCard)
// ============================================

/**
 * Format a date to a human-readable relative time string
 * @example formatDistanceToNow('2024-01-01T00:00:00Z') => "2 days ago"
 */
export function formatDistanceToNow(date: string | Date | null | undefined): string {
	if (!date) return 'Never';

	try {
		const dateObj = typeof date === 'string' ? new Date(date) : date;

		// Check if date is valid
		if (isNaN(dateObj.getTime())) {
			console.warn('[formatDistanceToNow] Invalid date:', date);
			return 'Unknown';
		}

		return fnsFormatDistanceToNow(dateObj, { addSuffix: true });
	} catch (error) {
		console.error('[formatDistanceToNow] Error formatting date:', error);
		return 'Unknown';
	}
}

/**
 * Format a date to a short relative time (e.g., "2h", "3d", "1w")
 * Used for compact displays like card footers
 */
export function formatShortDistance(date: string | Date | null | undefined): string {
	if (!date) return '-';

	try {
		const dateObj = typeof date === 'string' ? new Date(date) : date;

		if (isNaN(dateObj.getTime())) {
			return '-';
		}

		const now = new Date();
		const diffMs = now.getTime() - dateObj.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);
		const diffWeeks = Math.floor(diffDays / 7);
		const diffMonths = Math.floor(diffDays / 30);

		if (diffMins < 1) return 'now';
		if (diffMins < 60) return `${diffMins}m`;
		if (diffHours < 24) return `${diffHours}h`;
		if (diffDays < 7) return `${diffDays}d`;
		if (diffWeeks < 4) return `${diffWeeks}w`;
		return `${diffMonths}mo`;
	} catch (error) {
		console.error('[formatShortDistance] Error formatting date:', error);
		return '-';
	}
}

// ============================================
// Budget Formatting Helpers (for ProjectCard)
// ============================================

/**
 * Format a budget amount to a compact string (e.g., "$250K", "$1.2M")
 * @param amount - The amount in dollars
 * @param includeSign - Whether to include $ sign (default: true)
 */
export function formatBudget(amount: number | null | undefined, includeSign = true): string {
	if (amount === null || amount === undefined || isNaN(amount)) {
		return includeSign ? '$0' : '0';
	}

	const sign = includeSign ? '$' : '';
	const absAmount = Math.abs(amount);

	if (absAmount >= 1000000) {
		const value = (absAmount / 1000000).toFixed(1);
		// Remove trailing .0
		const formatted = value.endsWith('.0') ? value.slice(0, -2) : value;
		return `${sign}${formatted}M`;
	}

	if (absAmount >= 1000) {
		const value = (absAmount / 1000).toFixed(1);
		const formatted = value.endsWith('.0') ? value.slice(0, -2) : value;
		return `${sign}${formatted}K`;
	}

	return `${sign}${Math.round(absAmount)}`;
}

/**
 * Format a budget amount with full precision (e.g., "$250,000.00")
 * @param amount - The amount in dollars
 */
export function formatBudgetFull(amount: number | null | undefined): string {
	if (amount === null || amount === undefined || isNaN(amount)) {
		return '$0.00';
	}

	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

/**
 * Get budget variance display information
 * @param planned - Planned budget
 * @param actual - Actual spending
 */
export function getBudgetVarianceDisplay(
	planned: number | null | undefined,
	actual: number | null | undefined
): {
	variance: number;
	isUnder: boolean;
	displayText: string;
	percentVariance: number;
} {
	const plannedAmount = Number(planned) || 0;
	const actualAmount = Number(actual) || 0;
	const variance = plannedAmount - actualAmount;
	const isUnder = variance >= 0;
	const percentVariance = plannedAmount > 0
		? Math.round(Math.abs(variance) / plannedAmount * 100)
		: 0;

	let displayText: string;
	if (isUnder) {
		displayText = `Under ${formatBudget(variance)}`;
	} else {
		displayText = `Over ${formatBudget(Math.abs(variance))}`;
	}

	console.log('[getBudgetVarianceDisplay]', {
		planned: plannedAmount,
		actual: actualAmount,
		variance,
		isUnder,
		displayText,
		percentVariance,
	});

	return {
		variance,
		isUnder,
		displayText,
		percentVariance,
	};
}

// ============================================
// Schedule Status Helpers (for ProjectCard)
// ============================================

export type ScheduleStatusType = 'on-time' | 'at-risk' | 'delayed';

export interface ScheduleStatusInfo {
	status: ScheduleStatusType;
	daysRemaining: number;
	daysBehind: number;
	displayText: string;
}

/**
 * Get schedule status display information
 * @param endDate - Project end date
 * @param completionPercentage - Current completion percentage
 * @param startDate - Project start date (optional)
 */
export function getScheduleStatusDisplay(
	endDate: string | null | undefined,
	completionPercentage: number = 0,
	startDate?: string | null
): ScheduleStatusInfo {
	// Default values if no end date
	if (!endDate) {
		return {
			status: 'on-time',
			daysRemaining: 0,
			daysBehind: 0,
			displayText: 'No deadline',
		};
	}

	const now = new Date();
	const end = new Date(endDate);
	const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

	// Calculate expected progress based on timeline
	let expectedProgress = 100;
	if (startDate) {
		const start = new Date(startDate);
		const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
		const elapsedDays = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
		expectedProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
	}

	// Calculate days behind based on progress difference
	const progressDifference = expectedProgress - completionPercentage;
	const daysBehind = Math.max(0, Math.round((progressDifference / 100) * Math.max(0, daysRemaining)));

	// Determine status and display text
	let status: ScheduleStatusType = 'on-time';
	let displayText = 'On Track';

	if (daysRemaining < 0) {
		status = 'delayed';
		displayText = `${Math.abs(daysRemaining)} days overdue`;
	} else if (daysBehind > 5) {
		status = 'delayed';
		displayText = `${daysBehind} days behind`;
	} else if (daysBehind >= 1) {
		status = 'at-risk';
		displayText = `${daysBehind} days behind`;
	} else {
		displayText = daysRemaining === 0 ? 'Due today' : `${daysRemaining} days left`;
	}

	return {
		status,
		daysRemaining: Math.max(0, daysRemaining),
		daysBehind,
		displayText,
	};
} 