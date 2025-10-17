import LeaderboardView from './leaderboard.client';
import { verifyUser } from '@/lib/authentication';
import { ensureCommunityExists } from '@/lib/company';
import { syncCommunityEngagement } from '@/lib/whop-sync';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ExperiencePage({ params }) {
  const { experienceId } = await params;
  
  try {
    // Verify user has access to this experience
    const { userId, accessLevel, isOwner, companyContext } = await verifyUser(experienceId);
    
    console.log('✅ User verified:', { userId, accessLevel, isOwner, experienceId, companyId: companyContext.company.companyId });
    
    // Ensure community exists in database (creates if first time)
    await ensureCommunityExists(companyContext);
    
    // Auto-sync on every page load - fetch fresh community data from DB (like /api/sync-whop does)
    try {
      console.log('🔄 Auto-syncing leaderboard data...');
      
      // Fetch community from DB to get latest settings
      const { data: community } = await supabase
        .from('communities')
        .select('whop_company_id, name, settings')
        .eq('whop_company_id', companyContext.company.companyId)
        .single();
      
      if (community) {
        const forumExperiences = community.settings?.forumExperiences || [];
        const chatExperiences = community.settings?.chatExperiences || [];
        
        console.log('📊 Syncing with experiences:', { forumExperiences, chatExperiences });
        
        await syncCommunityEngagement(
          community.whop_company_id,
          forumExperiences,
          chatExperiences
        );
        console.log('✅ Auto-sync completed');
      }
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
