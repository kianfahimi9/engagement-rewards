/**
 * Whop Engagement Sync Endpoint
 * 
 * Manually trigger sync or will be called by cron job
 * GET /api/sync-whop - Sync all communities
 * POST /api/sync-whop - Sync specific community
 */

import { NextResponse } from 'next/server';
import { syncCommunityEngagement } from '@/lib/whop-sync';

// Hardcoded for MVP - will move to database
const COMMUNITIES = [
  {
    id: '2b7ecb03-7c43-4aca-ae53-c77cdf766d85', // Real UUID from Supabase
    name: 'Test Community',
    forumExperienceId: 'exp_2AXIaDSvdIf9L7',
    chatExperienceId: 'exp_4MjMbbnlbB5Fcv',
  }
];

export async function GET(request) {
  console.log('\n🚀 Starting Whop engagement sync...');
  
  try {
    const results = [];

    for (const community of COMMUNITIES) {
      console.log(`\nSyncing community: ${community.name}`);
      
      const result = await syncCommunityEngagement(
        community.id,
        community.forumExperienceId,
        community.chatExperienceId
      );

      results.push({
        community: community.name,
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
    const { communityId, forumExperienceId, chatExperienceId } = body;

    if (!communityId) {
      return NextResponse.json({
        error: 'communityId is required'
      }, { status: 400 });
    }

    console.log(`\n🚀 Syncing specific community: ${communityId}`);

    const result = await syncCommunityEngagement(
      communityId,
      forumExperienceId,
      chatExperienceId
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
