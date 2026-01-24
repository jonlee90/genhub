'use server';

import { stripe } from '@/utils/stripe';
import { headers } from 'next/headers';
import { createSupabaseAdminClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const supabaseAdmin = await createSupabaseAdminClient();

// ============================================
// Validation Schemas
// ============================================

const createPortalSessionSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
});

const refundSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
});

export async function getStripeCustomerId() {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error('User not authenticated');
	}

	try {
		const { data: customer, error } = await supabaseAdmin
			.from('stripe_customers')
			.select('stripe_customer_id')
			.eq('user_id', session.user.id)
			.maybeSingle();

		if (error) {
			console.error('[getStripeCustomerId] Error:', error);
			throw new Error('Failed to fetch customer ID');
		}

		return customer?.stripe_customer_id || null;
	} catch (error) {
		console.error('[getStripeCustomerId] Exception:', error);
		throw new Error('Failed to fetch customer ID');
	}
}

export async function createPortalSession(input: unknown) {
	// Validate input
	const validation = createPortalSessionSchema.safeParse(input);
	if (!validation.success) {
		console.error('[createPortalSession] Validation failed:', validation.error);
		throw new Error('Invalid customer ID');
	}

	const { customerId } = validation.data;

	// Check if payments are enabled
	if (process.env.NEXT_PUBLIC_PAYMENTS_ENABLED !== 'true') {
		throw new Error('Payments are currently disabled');
	}

	try {
		// get the current domain
		const headersList = await headers();
		const host = headersList.get('host');
		const protocol = headersList.get('x-forwarded-proto') || 'http';
		const baseUrl = `${protocol}://${host}`;
		const session = await stripe.billingPortal.sessions.create({
			customer: customerId,
			return_url: `${baseUrl}/app`,
		});
		return session.url; // return Portal URL
	} catch (error) {
		console.error('Error creating portal session:', error);
		throw new Error('Failed to create portal session');
	}
}


export async function refund(input: unknown) {
	// Validate input
	const validation = refundSchema.safeParse(input);
	if (!validation.success) {
		console.error('[refund] Validation failed:', validation.error);
		throw new Error('Invalid subscription ID');
	}

	const { subscriptionId } = validation.data;

	// Check if payments are enabled
	if (process.env.NEXT_PUBLIC_PAYMENTS_ENABLED !== 'true') {
		throw new Error('Payments are currently disabled');
	}

	try {
		const subscription = await stripe.subscriptions.retrieve(subscriptionId);
		const latestInvoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);

		if (latestInvoice.payment_intent) {
			const refund = await stripe.refunds.create({
				payment_intent: latestInvoice.payment_intent as string,
			});
			console.log('Refund created:', refund);
		}

		// Cancel the subscription immediately
		const cancelledSubscription = await stripe.subscriptions.cancel(subscriptionId);
		console.log('Cancelled subscription:', cancelledSubscription);

		//supabase delete the subscription
		// TODO: Fix stripe_customers table type - currently not in public schema
		// const { data, error } = await supabaseAdmin.from('stripe_customers').delete().eq('subscription_id', subscriptionId);
		// if (error) {
		// 	console.error('Error deleting subscription:', error);
		// }
		// console.log('Deleted subscription:', data);

		return { success: true };
	} catch (error: any) {
		console.error('Error processing refund:', error);
		throw new Error('Failed to process refund');
	}
}