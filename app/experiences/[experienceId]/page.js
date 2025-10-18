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
    // Pass userId if user is owner to store in DB
    await ensureCommunityExists(companyContext, isOwner ? userId : null);
    
    // Fetch community from DB to get latest settings and level names
    const { data: community } = await supabase
      .from('communities')
      .select('whop_company_id, name, settings, level_names, last_synced_at')
      .eq('whop_company_id', companyContext.company.companyId)
      .single();

    // Smart caching: Only sync if data is stale (older than 3 minutes)
    const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 minutes
    const now = new Date();
    const lastSynced = community?.last_synced_at ? new Date(community.last_synced_at) : null;
    const isCacheValid = lastSynced && (now - lastSynced) < CACHE_DURATION_MS;

    // Auto-sync leaderboard data (only if cache is stale)
    if (!isCacheValid) {
      try {
        console.log('🔄 Cache stale - syncing data...');
        
        if (community) {
          const forumExperiences = community.settings?.forumExperiences || [];
          const chatExperiences = community.settings?.chatExperiences || [];
          
          console.log('📊 Syncing with experiences:', { forumExperiences, chatExperiences });
          
          await syncCommunityEngagement(
            community.whop_company_id,
            forumExperiences,
            chatExperiences
          );

          // Update cache timestamp
          await supabase
            .from('communities')
            .update({ last_synced_at: now })
            .eq('whop_company_id', community.whop_company_id);

          console.log('✅ Auto-sync completed and cache updated');
        }
      } catch (syncError) {
        console.error('❌ Auto-sync failed:', syncError);
      }
    } else {
      console.log(`✅ Using cached data (synced ${Math.round((now - lastSynced) / 1000)}s ago)`);
    }
    
    // Pass auth info and company context to client component
    return (
      <LeaderboardView 
        experienceId={experienceId}
        userId={userId}
        isAdmin={isOwner}
        companyId={companyContext.company.companyId}
        companyContext={companyContext}
        levelNames={community?.level_names || null}
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
