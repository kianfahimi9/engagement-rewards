import LeaderboardView from './leaderboard.client';
import { verifyUser } from '@/lib/authentication';
import { ensureCommunityExists } from '@/lib/company';
import { syncCommunityEngagement } from '@/lib/whop-sync';
import { redirect } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ExperiencePage({ params }) {
  const { experienceId } = await params;
  
  try {
    // Verify user has access to this experience
    const { userId, accessLevel, companyContext } = await verifyUser(experienceId);
    
    console.log('✅ User verified:', { userId, accessLevel, experienceId, companyId: companyContext.company.companyId });
    
    // Ensure community exists in database (creates if first time)
    const communityData = await ensureCommunityExists(companyContext);
    
    // Auto-sync on every page load - call sync function directly
    try {
      console.log('🔄 Auto-syncing leaderboard data...');
      const forumExperiences = communityData?.settings?.forumExperiences || [];
      const chatExperiences = communityData?.settings?.chatExperiences || [];
      
      await syncCommunityEngagement(
        companyContext.company.companyId,
        forumExperiences,
        chatExperiences
      );
      console.log('✅ Auto-sync completed');
    } catch (syncError) {
      console.error('❌ Auto-sync failed:', syncError);
    }
    
    // Pass auth info and company context to client component
    return (
      <LeaderboardView 
        experienceId={experienceId}
        userId={userId}
        isAdmin={accessLevel === 'admin'}
        companyId={companyContext.company.companyId}
        companyContext={companyContext}
      />
    );
  } catch (error) {
    console.error('❌ Auth verification failed:', error);
    
    // Redirect to main page if not authenticated
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have access to this experience.
          </p>
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
