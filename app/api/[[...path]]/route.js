import { NextResponse } from 'next/server';

// Mock data for development - will be replaced with Supabase queries
const mockUsers = [
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
    const period = searchParams.get('period') || 'weekly';
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return mock data
    return NextResponse.json({
      success: true,
      leaderboard: mockUsers,
      currentUser: {
        id: 'current_user',
        whop_user_id: 'user_current',
        username: 'You',
        avatar_url: null,
        rank: 12,
        points: 743,
        engagement_generated: 54,
        current_streak: 5,
        longest_streak: 8
      },
      prizePool: mockPrizePool,
      period
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
        totalPoints: 743,
        rank: 12,
        currentStreak: 5,
        longestStreak: 8,
        engagementGenerated: 54,
        badges: [
          { id: '1', name: 'Hot Streak', icon: '🔥', description: '7 day streak', unlocked: true },
          { id: '2', name: 'Chatterbox', icon: '💬', description: '100 comments', unlocked: true },
          { id: '3', name: 'Rising Star', icon: '⭐', description: 'Top 10 rank', unlocked: false },
        ]
      }
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

// Main route handler
export async function GET(request) {
  const pathname = new URL(request.url).pathname;

  if (pathname.startsWith('/api/leaderboard')) {
    return getLeaderboard(request);
  }
  
  if (pathname.startsWith('/api/user-stats')) {
    return getUserStats(request);
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

  return NextResponse.json(
    { error: 'Not found' },
    { status: 404 }
  );
}