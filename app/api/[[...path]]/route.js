import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateLevel, getLevelBadge } from '@/lib/points-system';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// DEPRECATED - Keeping for reference only
const mockUsers_OLD = [
  { 
    id: '1', 
    whop_user_id: 'user_1', 
    username: 'Sarah Chen', 
    avatar_url: null,
    rank: 1, 
    points: 2847, 
    engagement_generated: 324,
    current_streak: 21,
    longest_streak: 21
  },
  { 
    id: '2', 
    whop_user_id: 'user_2', 
    username: 'Alex Rivera', 
    avatar_url: null,
    rank: 2, 
    points: 2156, 
    engagement_generated: 198,
    current_streak: 14,
    longest_streak: 18
  },
  { 
    id: '3', 
    whop_user_id: 'user_3', 
    username: 'Jordan Park', 
    avatar_url: null,
    rank: 3, 
    points: 1923, 
    engagement_generated: 156,
    current_streak: 9,
    longest_streak: 12
  },
  { 
    id: '4', 
    whop_user_id: 'user_4', 
    username: 'Taylor Swift', 
    avatar_url: null,
    rank: 4, 
    points: 1654, 
    engagement_generated: 143,
    current_streak: 7,
    longest_streak: 15
  },
  { 
    id: '5', 
    whop_user_id: 'user_5', 
    username: 'Morgan Lee', 
    avatar_url: null,
    rank: 5, 
    points: 1432, 
    engagement_generated: 127,
    current_streak: 12,
    longest_streak: 12
  },
  { 
    id: '6', 
    whop_user_id: 'user_6', 
    username: 'Casey Johnson', 
    avatar_url: null,
    rank: 6, 
    points: 1287, 
    engagement_generated: 98,
    current_streak: 5,
    longest_streak: 9
  },
  { 
    id: '7', 
    whop_user_id: 'user_7', 
    username: 'Jamie Davis', 
    avatar_url: null,
    rank: 7, 
    points: 1145, 
    engagement_generated: 89,
    current_streak: 3,
    longest_streak: 7
  },
  { 
    id: '8', 
    whop_user_id: 'user_8', 
    username: 'Riley Martinez', 
    avatar_url: null,
    rank: 8, 
    points: 987, 
    engagement_generated: 76,
    current_streak: 2,
    longest_streak: 6
  },
];

const mockPrizePool = {
  id: '1',
  community_id: 'comm_1',
  amount: 500,
  currency: 'USD',
  period_start: '2025-01-20',
  period_end: '2025-01-26',
  status: 'active'
};

// GET /api/leaderboard
async function getLeaderboard(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all_time';
    const communityId = searchParams.get('communityId') || '2b7ecb03-7c43-4aca-ae53-c77cdf766d85'; // Default to test community
    
    // Fetch leaderboard entries with user data
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('leaderboard_entries')
      .select(`
        id,
        user_id,
        points,
        rank,
        engagement_generated,
        users (
          id,
          whop_user_id,
          username,
          avatar_url
        )
      `)
      .eq('community_id', communityId)
      .eq('period_type', period)
      .order('points', { ascending: false })
      .limit(10);

    if (leaderboardError) throw leaderboardError;

    // Fetch current user's stats (for now, use first user as example)
    const currentUserId = leaderboardData?.[0]?.user_id;
    
    const { data: currentUserData } = await supabase
      .from('leaderboard_entries')
      .select(`
        id,
        user_id,
        points,
        rank,
        engagement_generated,
        users (
          id,
          whop_user_id,
          username,
          avatar_url
        )
      `)
      .eq('community_id', communityId)
      .eq('period_type', period)
      .eq('user_id', currentUserId)
      .single();

    // Fetch daily streak for current user
    const { data: streakData } = await supabase
      .from('daily_streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', currentUserId)
      .eq('community_id', communityId)
      .single();

    // Fetch active prize pool
    const { data: prizePoolData } = await supabase
      .from('prize_pools')
      .select('*')
      .eq('community_id', communityId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Format leaderboard data
    const formattedLeaderboard = (leaderboardData || []).map((entry, index) => ({
      id: entry.users.id,
      whop_user_id: entry.users.whop_user_id,
      username: entry.users.username || 'Anonymous',
      avatar_url: entry.users.avatar_url,
      rank: index + 1,
      points: entry.points || 0,
      engagement_generated: entry.engagement_generated || 0,
      current_streak: 0, // Will be populated from daily_streaks if needed
      longest_streak: 0,
      level: calculateLevel(entry.points || 0),
    }));

    // Format current user
    const formattedCurrentUser = currentUserData ? {
      id: currentUserData.users.id,
      whop_user_id: currentUserData.users.whop_user_id,
      username: currentUserData.users.username || 'You',
      avatar_url: currentUserData.users.avatar_url,
      rank: currentUserData.rank || 0,
      points: currentUserData.points || 0,
      engagement_generated: currentUserData.engagement_generated || 0,
      current_streak: streakData?.current_streak || 0,
      longest_streak: streakData?.longest_streak || 0,
      level: calculateLevel(currentUserData.points || 0),
    } : null;

    // Format prize pool
    const formattedPrizePool = prizePoolData ? {
      id: prizePoolData.id,
      amount: parseFloat(prizePoolData.amount),
      currency: prizePoolData.currency,
      period_start: prizePoolData.period_start,
      period_end: prizePoolData.period_end,
      status: prizePoolData.status,
    } : {
      id: 'default',
      amount: 0,
      currency: 'USD',
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'none',
    };

    return NextResponse.json({
      success: true,
      leaderboard: formattedLeaderboard,
      currentUser: formattedCurrentUser,
      prizePool: formattedPrizePool,
      period,
      dataSource: 'real', // Flag to indicate real data
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/user-stats
async function getUserStats(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Mock user stats
    return NextResponse.json({
      success: true,
      stats: {
        username: 'You',
        avatar_url: null,
        totalPoints: 743,
        rank: 12,
        currentStreak: 5,
        longestStreak: 8,
        engagementGenerated: 54,
        totalLogins: 45,
        likesReceived: 123,
        commentsReceived: 87,
        sharesReceived: 12,
        badges: [
          { id: '1', name: 'Hot Streak', icon: '🔥', description: '7 day streak', unlocked: true },
          { id: '2', name: 'Chatterbox', icon: '💬', description: '100 comments', unlocked: true },
          { id: '3', name: 'Rising Star', icon: '⭐', description: 'Top 10 rank', unlocked: false },
          { id: '4', name: 'Engagement King', icon: '👑', description: '500+ engagement', unlocked: false },
          { id: '5', name: 'Consistent', icon: '📅', description: '30 day streak', unlocked: false },
          { id: '6', name: 'Influencer', icon: '✨', description: '1000+ engagement', unlocked: false },
        ]
      },
      earnings: [
        {
          id: '1',
          amount: 200,
          rank: 2,
          date: '2025-01-12',
          period: 'Weekly',
          status: 'completed'
        },
        {
          id: '2',
          amount: 75,
          rank: 7,
          date: '2025-01-05',
          period: 'Weekly',
          status: 'completed'
        }
      ]
    });
  } catch (error) {
    console.error('User stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/prize-pool
async function createPrizePool(request) {
  try {
    const body = await request.json();
    const { communityId, amount, periodStart, periodEnd } = body;

    // TODO: Implement Supabase insert
    // const { data, error } = await supabase
    //   .from('prize_pools')
    //   .insert([{ community_id: communityId, amount, period_start: periodStart, period_end: periodEnd }])
    //   .select()
    //   .single();

    return NextResponse.json({
      success: true,
      prizePool: {
        id: 'new_pool_' + Date.now(),
        community_id: communityId,
        amount,
        period_start: periodStart,
        period_end: periodEnd,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Prize pool creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/sync-engagement
async function syncEngagement(request) {
  try {
    const body = await request.json();
    const { whopUserId, communityId, engagementData } = body;

    // TODO: Implement engagement sync logic
    // This will be called by Whop webhooks to sync engagement data
    // 1. Create/update user in Supabase
    // 2. Update engagement metrics
    // 3. Calculate points
    // 4. Update leaderboard entries
    // 5. Check for streak updates

    return NextResponse.json({
      success: true,
      message: 'Engagement synced successfully'
    });
  } catch (error) {
    console.error('Sync engagement error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/admin/dashboard
async function getAdminDashboard(request) {
  try {
    // Mock admin stats
    return NextResponse.json({
      success: true,
      stats: {
        totalMembers: 847,
        newMembersThisWeek: 23,
        totalPaidOut: 2450,
        completedPools: 5,
        engagementScore: 8.7,
        engagementGrowth: 15.3,
        activeStreaks: 126,
        totalPosts: 1243,
        totalComments: 3421,
        totalLikes: 5678,
        avgEngagement: 12.3
      },
      prizePools: [
        {
          id: 'pool_1',
          amount: 500,
          period_start: '2025-01-20',
          period_end: '2025-01-26',
          status: 'active'
        },
        {
          id: 'pool_2',
          amount: 750,
          period_start: '2025-01-13',
          period_end: '2025-01-19',
          status: 'completed'
        }
      ],
      payouts: [
        {
          id: '1',
          username: 'Sarah Chen',
          amount: 300,
          rank: 1,
          status: 'completed',
          paid_at: '2025-01-19'
        },
        {
          id: '2',
          username: 'Alex Rivera',
          amount: 225,
          rank: 2,
          status: 'completed',
          paid_at: '2025-01-19'
        },
        {
          id: '3',
          username: 'Jordan Park',
          amount: 150,
          rank: 3,
          status: 'processing',
          paid_at: '2025-01-19'
        }
      ]
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/prize-pool
async function createAdminPrizePool(request) {
  try {
    const body = await request.json();
    const { amount, communityId } = body;

    // TODO: Implement Supabase insert
    // Calculate period dates (current week)
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - now.getDay()); // Start of week
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + 6); // End of week

    return NextResponse.json({
      success: true,
      prizePool: {
        id: 'new_pool_' + Date.now(),
        community_id: communityId,
        amount,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Create prize pool error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/process-payouts
async function processPayouts(request) {
  try {
    const body = await request.json();
    const { prizePoolId } = body;

    // TODO: Implement payout processing
    // 1. Get top 10 users from leaderboard for the prize pool period
    // 2. Calculate payout amounts based on distribution (40%, 30%, 20%, 10%)
    // 3. Create payout records in Supabase
    // 4. Call Whop payment API to send payments
    // 5. Update prize pool status to 'paid_out'

    return NextResponse.json({
      success: true,
      message: 'Payouts processed successfully',
      payoutsCreated: 10
    });
  } catch (error) {
    console.error('Process payouts error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/admin/level-names
async function getLevelNames(request) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');

    // TODO: Get from Supabase
    // const { data, error } = await supabase
    //   .from('communities')
    //   .select('level_names')
    //   .eq('whop_community_id', communityId)
    //   .single();

    // Return default level names for now
    return NextResponse.json({
      success: true,
      levelNames: {
        "1": "Level 1",
        "2": "Level 2",
        "3": "Level 3",
        "4": "Level 4",
        "5": "Level 5",
        "6": "Level 6",
        "7": "Level 7",
        "8": "Level 8",
        "9": "Level 9",
        "10": "Level 10"
      }
    });
  } catch (error) {
    console.error('Get level names error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/level-names
async function updateLevelNames(request) {
  try {
    const body = await request.json();
    const { communityId, levelNames } = body;

    // Validate levelNames object
    if (!levelNames || typeof levelNames !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid level names format' },
        { status: 400 }
      );
    }

    // TODO: Update in Supabase
    // const { data, error } = await supabase
    //   .from('communities')
    //   .update({ level_names: levelNames })
    //   .eq('whop_community_id', communityId)
    //   .select()
    //   .single();

    return NextResponse.json({
      success: true,
      message: 'Level names updated successfully',
      levelNames
    });
  } catch (error) {
    console.error('Update level names error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Main route handler
export async function GET(request) {
  const pathname = new URL(request.url).pathname;

  if (pathname.startsWith('/api/leaderboard')) {
    return getLeaderboard(request);
  }
  
  if (pathname.startsWith('/api/user-stats')) {
    return getUserStats(request);
  }

  if (pathname.startsWith('/api/admin/dashboard')) {
    return getAdminDashboard(request);
  }

  if (pathname.startsWith('/api/admin/level-names')) {
    return getLevelNames(request);
  }

  return NextResponse.json({ message: 'API Route' });
}

export async function POST(request) {
  const pathname = new URL(request.url).pathname;

  if (pathname.startsWith('/api/prize-pool')) {
    return createPrizePool(request);
  }

  if (pathname.startsWith('/api/sync-engagement')) {
    return syncEngagement(request);
  }

  if (pathname.startsWith('/api/admin/prize-pool')) {
    return createAdminPrizePool(request);
  }

  if (pathname.startsWith('/api/admin/process-payouts')) {
    return processPayouts(request);
  }

  if (pathname.startsWith('/api/admin/level-names')) {
    return updateLevelNames(request);
  }

  return NextResponse.json(
    { error: 'Not found' },
    { status: 404 }
  );
}