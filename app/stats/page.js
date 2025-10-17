import StatsView from './stats.client';
import { verifyUser } from '@/lib/authentication';
import { ensureCommunityExists } from '@/lib/company';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function UserStatsPage({ searchParams }) {
  const params = await searchParams;
  const experienceId = params?.experienceId;
  
  if (!experienceId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Missing Experience ID</h1>
          <p className="text-gray-600 mb-4">Please access this page from a valid community.</p>
        </div>
      </div>
    );
  }
  
  try {
    // Verify user has access to this experience (same as leaderboard page)
    const { userId, accessLevel, companyContext } = await verifyUser(experienceId);
    
    console.log('✅ Stats page - User verified:', { userId, experienceId, companyId: companyContext.company.companyId });
    
    // Ensure community exists and trigger sync (same as leaderboard page)
    await ensureCommunityExists(companyContext);
    
    // Pass auth info to client component
    return (
      <StatsView 
        experienceId={experienceId}
        userId={userId}
        companyId={companyContext.company.companyId}
      />
    );
  } catch (error) {
    console.error('❌ Stats page auth verification failed:', error);
    
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have access to this experience.</p>
          <a 
            href="/" 
            className="text-blue-500 hover:underline"
          >
            Go to main page
          </a>
        </div>
      </div>
    );
  }
}
