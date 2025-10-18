/**
 * Whop Engagement Sync Endpoint
 * 
 * Manually trigger sync or will be called by cron job
 * GET /api/sync-whop - Sync all communities from database
 * POST /api/sync-whop - Sync specific community
 */

import { NextResponse } from 'next/server';
import { syncCommunityEngagement } from '@/lib/whop-sync';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  console.log('\n🚀 Starting Whop engagement sync...');
  
  try {
    // Fetch all communities from database
    const { data: communities, error: fetchError } = await supabase
      .from('communities')
      .select('whop_company_id, name, settings');
    
    if (fetchError) {
      throw new Error(`Failed to fetch communities: ${fetchError.message}`);
    }
    
    if (!communities || communities.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No communities found to sync',
        results: []
      });
    }
    
    console.log(`Found ${communities.length} communities to sync`);
    
    const results = [];

    for (const community of communities) {
      console.log(`\nSyncing community: ${community.name}`);
      
      // Extract forum and chat experiences from settings
      const forumExperiences = community.settings?.forumExperiences || [];
      const chatExperiences = community.settings?.chatExperiences || [];
      
      const result = await syncCommunityEngagement(
        community.whop_company_id,
        forumExperiences,
        chatExperiences
      );

      results.push({
        community: community.name,
        companyId: community.whop_company_id,
        ...result
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      timestamp: new Date().toISOString(),
      results: results,
    });

  } catch (error) {
    console.error('❌ Sync failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

// Sync specific community
export async function POST(request) {
  try {
    const body = await request.json();
    const { communityId } = body;

    if (!communityId) {
      return NextResponse.json({
        error: 'communityId is required'
      }, { status: 400 });
    }

    console.log(`\n🚀 Syncing specific community: ${communityId}`);

    // Fetch community from DB to get latest settings (same as GET endpoint does)
    const { data: community, error: fetchError } = await supabase
      .from('communities')
      .select('whop_company_id, name, settings')
      .eq('whop_company_id', communityId)
      .single();

    if (fetchError || !community) {
      return NextResponse.json({
        error: `Community not found: ${communityId}`,
        details: fetchError?.message
      }, { status: 404 });
    }

    // Extract forum and chat experiences from settings
    const forumExperiences = community.settings?.forumExperiences || [];
    const chatExperiences = community.settings?.chatExperiences || [];

    console.log('📊 Syncing with experiences:', { forumExperiences, chatExperiences });

    const result = await syncCommunityEngagement(
      community.whop_company_id,
      forumExperiences,
      chatExperiences
    );

    return NextResponse.json({
      success: true,
      message: 'Community synced successfully',
      result: result,
    });

  } catch (error) {
    console.error('❌ Community sync failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
