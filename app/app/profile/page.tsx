import { Suspense } from 'react';
import Loading from '@/components/app/profile/loading';
import ProfileAndBillingContent from '@/components/app/profile/ProfileAndBillingContent';
import { SessionProviderWrapper } from '@/components/providers/SessionProviderWrapper';

export default function ProfilePage() {
	return (
		<div className="max-w-4xl mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">Profile & Billing</h1>
			<Suspense fallback={<Loading />}>
				<SessionProviderWrapper>
					<ProfileAndBillingContent />
				</SessionProviderWrapper>
			</Suspense>
		</div>
	);
}
