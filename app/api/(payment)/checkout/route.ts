
import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe';
import { getSupabaseClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
export async function POST(request: Request) {
	try {
		const userSession = await auth()
		const userId = userSession?.user?.id
		// 检查 userId 是否存在
		if (!userId) {
			return new Response('User ID is required', { status: 400 });
		}
		const { priceId, email } = await request.json();
		const supabase = await getSupabaseClient();

		const { data: subscriptionData, error: subscriptionError } = await supabase
			.from('stripe_customers')
			.select('*')
			.eq('user_id', userId)
			.eq('plan_active', true)
			.single();

		if (subscriptionData) {
			return NextResponse.json({ message: 'User already subscribed' }, { status: 400 });
		}

		const session = await stripe.checkout.sessions.create({
			metadata: {
				user_id: userId,
			},
			customer_email: email,
			payment_method_types: ['card'],
			line_items: [
				{
					quantity: 1,
					price: priceId,
				}
			],
			mode: 'subscription',
			success_url: `${request.headers.get('origin')}/success`,
			cancel_url: `${request.headers.get('origin')}/cancel`,
		});


		return NextResponse.json({ id: session.id, client_secret: session.client_secret });
	} catch (error: any) {
		console.error(error);
		return NextResponse.json({ message: error.message }, { status: 500 });
	}
}