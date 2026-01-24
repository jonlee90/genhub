'use client';

import { createPortalSession, getStripeCustomerId } from '@/app/actions/stripe';
import { SessionProvider, useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

function PortalButtonContent() {
	const { data: session } = useSession();
	const [isLoading, setIsLoading] = useState(false);
	const user = session?.user;

	if (!user) {
		return <div>User not found</div>
	}

	const handleClick = async () => {
		try {
			setIsLoading(true);

			if (!user) {
				throw 'Please log in to manage your billing.';
			}

			// Fetch Stripe customer ID via server action
			const customerId = await getStripeCustomerId();

			if (customerId) {
				const url = await createPortalSession(customerId);
				window.location.href = url;
			} else {
				toast.error('No billing information found');
			}
		} catch (error) {
			console.error('Failed to create billing portal session:', error);
			toast.error(error?.toString() || 'Failed to create billing portal session');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div>
			<div className="mt-1">
				<p className="text-sm text-gray-600 mb-3">Click the button below to manage your billing settings and subscription</p>
				<button
					className={`w-full rounded-lg py-2 transition-colors ${isLoading
						? 'bg-gray-400 cursor-not-allowed'
						: 'bg-[#5059FE] hover:bg-[#4048ed]'
						} text-white font-medium`}
					onClick={handleClick}
					disabled={isLoading}
				>
					{isLoading ? 'Processing...' : 'Manage Billing'}
				</button>
			</div>
		</div>
	);
}

export default function PortalButton() {
	return (
		<SessionProvider>
			<PortalButtonContent />
		</SessionProvider>
	);
}