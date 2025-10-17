import StatsView from './stats.client';
import { Suspense } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Wrapper to handle URL params
async function StatsPageWrapper({ searchParams }) {
  const params = await searchParams;
  const experienceId = params?.experienceId || null;
  
  // For now, pass mock data - in production, these would come from server-side auth
  // Similar to how the experience page does it with verifyUser()
  const mockUserId = 'user_test123'; // TODO: Get from verifyUser() in production
  const mockCompanyId = '2b7ecb03-7c43-4aca-ae53-c77cdf766d85'; // TODO: Get from verifyUser() in production
  
  return (
    <StatsView 
      experienceId={experienceId}
      userId={mockUserId}
      companyId={mockCompanyId}
    />
  );
}

export default function UserStatsPage({ searchParams }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FCF6F5] dark:bg-[#141212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FA4616]"></div>
      </div>
    }>
      <StatsPageWrapper searchParams={searchParams} />
    </Suspense>
  );
}
