import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateLevel, getLevelBadge } from '@/lib/points-system';
import { whopSdk } from '@/lib/whop-sdk';
import { headers } from 'next/headers';

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
  whop_company_id: 'comm_1',
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
    const companyId = searchParams.get('companyId');
    const currentUserId = searchParams.get('userId'); // Get actual logged-in user ID
    
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      );
    }
    
    if (!currentUserId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }
    
    // Fetch leaderboard entries with user data
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('leaderboard_entries')
      .select(`
        whop_user_id,
        points,
        rank,
        engagement_generated,
        users (
          whop_user_id,
          username,
          avatar_url
        )
      `)
      .eq('whop_company_id', companyId)
      .eq('period_type', period)
      .order('points', { ascending: false })
      .limit(10);

    if (leaderboardError) throw leaderboardError;

    // Fetch current user's stats using the actual logged-in userId
    const { data: currentUserData } = await supabase
      .from('leaderboard_entries')
      .select(`
        whop_user_id,
        points,
        rank,
        engagement_generated,
        users (
          whop_user_id,
          username,
          avatar_url
        )
      `)
      .eq('whop_company_id', companyId)
      .eq('period_type', period)
      .eq('whop_user_id', currentUserId)
      .single();

    // Fetch daily streak for current user
    const { data: streakData } = await supabase
      .from('daily_streaks')
      .select('current_streak, longest_streak')
      .eq('whop_user_id', currentUserId)
      .eq('whop_company_id', companyId)
      .single();

    // Fetch ALL streaks for users in this community
    const { data: allStreaks } = await supabase
      .from('daily_streaks')
      .select('whop_user_id, current_streak, longest_streak')
      .eq('whop_company_id', companyId);

    // Create a map for quick lookup
    const streaksMap = {};
    if (allStreaks) {
      allStreaks.forEach(s => {
        streaksMap[s.whop_user_id] = {
          current_streak: s.current_streak,
          longest_streak: s.longest_streak
        };
      });
    }

    // Fetch active prize pool
    const { data: prizePoolData } = await supabase
      .from('prize_pools')
      .select('*')
      .eq('whop_company_id', companyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Format leaderboard data with streaks
    const formattedLeaderboard = (leaderboardData || []).map((entry, index) => {
      const userStreak = streaksMap[entry.users.whop_user_id] || { current_streak: 0, longest_streak: 0 };
      return {
        whop_user_id: entry.users.whop_user_id,
        username: entry.users.username || 'Anonymous',
        avatar_url: entry.users.avatar_url,
        rank: index + 1,
        points: entry.points || 0,
        engagement_generated: entry.engagement_generated || 0,
        current_streak: userStreak.current_streak,
        longest_streak: userStreak.longest_streak,
        level: calculateLevel(entry.points || 0),
      };
    });

    // Format current user
    const formattedCurrentUser = currentUserData ? {
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
      whop_payment_id: prizePoolData.whop_payment_id,
      amount: parseFloat(prizePoolData.amount),
      currency: prizePoolData.currency,
      period_start: prizePoolData.period_start,
      period_end: prizePoolData.period_end,
      status: prizePoolData.status,
    } : {
      whop_payment_id: 'default',
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
    const companyId = searchParams.get('companyId') || '2b7ecb03-7c43-4aca-ae53-c77cdf766d85';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('📊 Fetching stats for user:', userId, 'company:', companyId);

    // Fetch user data - don't use .single() or .maybeSingle()
    const { data: userDataArray, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('whop_user_id', userId);

    const userData = userDataArray && userDataArray.length > 0 ? userDataArray[0] : null;

    // If user doesn't exist, return empty stats
    if (!userData) {
      console.log(`User ${userId} not found, returning empty stats`);
      return NextResponse.json({
        success: true,
        user: {
          whop_user_id: userId,
          username: 'Unknown User',
          avatar_url: null,
          totalPoints: 0,
          rank: 0,
          level: 0,
          levelBadge: '🌱',
          currentStreak: 0,
          longestStreak: 0,
          engagementGenerated: 0,
          totalLogins: 0,
          forumPosts: 0,
          chatMessages: 0,
          likesReceived: 0,
          commentsReceived: 0,
          sharesReceived: 0,
          badges: []
        },
        earnings: [],
        dataSource: 'empty'
      });
    }

    // Fetch leaderboard entry for user
    const { data: leaderboardArray } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('whop_user_id', userId)
      .eq('whop_company_id', companyId)
      .eq('period_type', 'all_time');

    const leaderboardEntry = leaderboardArray && leaderboardArray.length > 0 ? leaderboardArray[0] : null;

    // Fetch streak data
    const { data: streakArray } = await supabase
      .from('daily_streaks')
      .select('*')
      .eq('whop_user_id', userId)
      .eq('whop_company_id', companyId);

    const streakData = streakArray && streakArray.length > 0 ? streakArray[0] : null;

    // Fetch user's posts for activity breakdown
    const { data: postsData } = await supabase
      .from('posts')
      .select('post_type, points, created_at')
      .eq('whop_user_id', userId)
      .eq('whop_company_id', companyId)
      .order('created_at', { ascending: false });

    // Fetch earnings (payouts)
    const { data: earningsData } = await supabase
      .from('payouts')
      .select('*')
      .eq('whop_user_id', userId)
      .eq('whop_company_id', companyId)
      .order('created_at', { ascending: false});

    // Calculate activity breakdown
    const forumPosts = postsData?.filter(p => p.post_type === 'forum').length || 0;
    const chatMessages = postsData?.filter(p => p.post_type === 'chat').length || 0;
    const totalPoints = leaderboardEntry?.points || 0;

    // Format response
    const stats = {
      user: {
        whop_user_id: userData.whop_user_id,
        username: userData.username,
        avatar_url: userData.avatar_url,
        totalPoints: totalPoints,
        rank: leaderboardEntry?.rank || 0,
        level: calculateLevel(totalPoints),
        levelBadge: getLevelBadge(calculateLevel(totalPoints)),
        currentStreak: streakData?.current_streak || 0,
        longestStreak: streakData?.longest_streak || 0,
        engagementGenerated: leaderboardEntry?.engagement_generated || 0,
        totalLogins: 0, // Not tracked yet
        forumPosts: forumPosts,
        chatMessages: chatMessages,
        likesReceived: 0, // Not tracked (Whop API limitation)
        commentsReceived: 0, // Not tracked yet
        sharesReceived: 0, // Not tracked yet
        badges: [] // TODO: Implement badge system
      },
      earnings: (earningsData || []).map(earning => ({
        whop_payout_id: earning.whop_payment_id,
        amount: parseFloat(earning.amount),
        rank: earning.rank,
        date: earning.created_at,
        period: 'Weekly', // TODO: Get from prize pool
        status: earning.status
      }))
    };

    return NextResponse.json({
      success: true,
      ...stats,
      dataSource: 'real'
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
    const { companyId, amount, periodStart, periodEnd } = body;

    // TODO: Implement Supabase insert
    // const { data, error } = await supabase
    //   .from('prize_pools')
    //   .insert([{ whop_company_id: companyId, amount, period_start: periodStart, period_end: periodEnd }])
    //   .select()
    //   .single();

    return NextResponse.json({
      success: true,
      prizePool: {
        id: 'new_pool_' + Date.now(),
        whop_company_id: companyId,
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
    const { whopUserId, companyId, engagementData } = body;

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
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || '2b7ecb03-7c43-4aca-ae53-c77cdf766d85';

    // Get total members
    const { count: totalMembers } = await supabase
      .from('community_members')
      .select('*', { count: 'exact', head: true })
      .eq('whop_company_id', companyId);

    // Get total posts and engagement
    const { data: postsData } = await supabase
      .from('posts')
      .select('post_type, points')
      .eq('whop_company_id', companyId);

    const totalPosts = postsData?.filter(p => p.post_type === 'forum').length || 0;
    const totalChatMessages = postsData?.filter(p => p.post_type === 'chat').length || 0;
    const totalEngagement = postsData?.reduce((sum, p) => sum + (parseFloat(p.points) || 0), 0) || 0;

    // Get prize pools
    const { data: prizePools } = await supabase
      .from('prize_pools')
      .select('*')
      .eq('whop_company_id', companyId)
      .order('created_at', { ascending: false });

    const activePools = prizePools?.filter(p => p.status === 'active') || [];
    const completedPools = prizePools?.filter(p => p.status === 'completed') || [];

    // Get total paid out
    const { data: payouts } = await supabase
      .from('payouts')
      .select('amount')
      .eq('whop_company_id', companyId)
      .eq('status', 'completed');

    const totalPaidOut = payouts?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    // Get active streaks
    const { data: streaks } = await supabase
      .from('daily_streaks')
      .select('current_streak')
      .eq('whop_company_id', companyId)
      .gt('current_streak', 0);

    const activeStreaks = streaks?.length || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalMembers: totalMembers || 0,
        newMembersThisWeek: 0, // TODO: Filter by last 7 days
        totalPaidOut: totalPaidOut,
        completedPools: completedPools.length,
        engagementScore: totalEngagement / (totalMembers || 1),
        engagementGrowth: 0, // TODO: Calculate growth
        activeStreaks: activeStreaks,
        totalPosts: totalPosts,
        totalChatMessages: totalChatMessages,
        totalLikes: 0, // Not tracked (Whop limitation)
        avgEngagement: totalEngagement / (totalPosts || 1)
      },
      prizePools: prizePools || [],
      dataSource: 'real'
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
    const { amount, companyId } = body;

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
        whop_company_id: companyId,
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
    const companyId = searchParams.get('companyId');

    // TODO: Get from Supabase
    // const { data, error } = await supabase
    //   .from('communities')
    //   .select('level_names')
    //   .eq('whop_whop_company_id', companyId)
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
    const { companyId, levelNames } = body;

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
    //   .eq('whop_whop_company_id', companyId)
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