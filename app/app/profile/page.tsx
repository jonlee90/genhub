import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import Loading from '@/components/app/profile/loading';
import ProfileAndBillingContent from '@/components/app/profile/ProfileAndBillingContent';
import { SessionProviderWrapper } from '@/components/providers/SessionProviderWrapper';

export default async function ProfilePage() {
	// Get session server-side to pass to SessionProvider
	const session = await auth();

	return (
		<div className="max-w-4xl mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">Profile & Billing</h1>
			<Suspense fallback={<Loading />}>
				<SessionProviderWrapper session={session}>
					<ProfileAndBillingContent />
				</SessionProviderWrapper>
			</Suspense>
		</div>
	);
}
