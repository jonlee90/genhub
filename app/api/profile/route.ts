import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/utils/supabase/server';
import { auth } from "@/lib/auth";
import { stripe } from '@/utils/stripe';
import config from '@/config';

// Helper function to get plan name from price ID
function getPlanNameFromPriceId(priceId: string): { name: string; interval: string } {
	for (const [planType, planData] of Object.entries(config.stripe)) {
		if (planData.monthPriceId === priceId) {
			return { name: planData.name, interval: 'month' };
		}
		if (planData.yearPriceId === priceId) {
			return { name: planData.name, interval: 'year' };
		}
	}
	return { name: 'Unknown Plan', interval: 'month' };
}

export async function GET() {
	try {
		const supabase = await getSupabaseClient();
		const session = await auth();

		const userId = session?.user?.id;
		if (!userId) {
			return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
		}

		// Get user data
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('*')
			.eq('id', userId)
			.single();

		if (userError) {
			console.error('Error fetching user data:', userError);
			return NextResponse.json({ error: 'Error fetching user data' }, { status: 500 });
		}

		// Get subscription data
		const { data: subscriptionData, error: subscriptionError } = await supabase
			.from('stripe_customers')
			.select('*')
			.eq('user_id', userId)
			.eq('plan_active', true)
			.single();

		let planName = 'Free';
		let planInterval = 'month';
		let subscription = null;

		if (subscriptionData?.subscription_id) {
			subscription = await stripe.subscriptions.retrieve(subscriptionData.subscription_id);
			const priceId = subscription.items.data[0].price.id;
			const planInfo = getPlanNameFromPriceId(priceId);
			planName = planInfo.name;
			planInterval = planInfo.interval;
		}

		// Convert the price data object into an array with type information
		const priceData = Object.entries(config.stripe).map(([type, data]) => ({
			type,
			...data
		}));

		return NextResponse.json({
			userData,
			subscriptionData,
			planName,
			planInterval,
			priceData
		});
	} catch (error) {
		console.error('Error in profile API route:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
} 