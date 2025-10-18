/**
 * Whop Engagement Sync Service
 * 
 * Polls Whop API for forum posts and chat messages
 * Calculates points and updates Supabase
 */

import { whopSdk } from '@/lib/whop-sdk';
import { calculateForumPostPoints, calculateChatMessagePoints } from '@/lib/points-system';
import { supabase } from '@/lib/supabase';

/**
 * Sync forum posts from Whop
 */
export async function syncForumPosts(communityId, forumExperienceId) {
  console.log(`\n🔄 Syncing forum posts for community: ${communityId}`);
  
  try {
    // Use the NEW forumPosts API with all engagement metrics
    // SDK method: client.forumPosts.list({ experience_id })
    const posts = [];
    
    for await (const post of whopSdk.forumPosts.list({ experience_id: forumExperienceId })) {
      // Fetch individual post to get accurate engagement counts
      try {
        const fullPost = await whopSdk.forumPosts.retrieve(post.id);
        posts.push(fullPost);
      } catch (error) {
        console.error(`❌ Failed to retrieve post ${post.id}:`, error.message);
        posts.push(post); // Fallback to list data
      }
    }

    console.log(`Found ${posts.length} forum posts from Whop API`);
    
    // Debug: Log first post structure
    if (posts.length > 0) {
      console.log('🔍 First post structure:', {
        hasViewCount: 'view_count' in posts[0],
        hasLikeCount: 'like_count' in posts[0],
        hasCommentCount: 'comment_count' in posts[0],
        isPinned: posts[0].is_pinned
      });
    }

    let synced = 0;
    let skipped = 0;

    for (const post of posts) {
      // Check if post already exists
      const { data: existing } = await supabase
        .from('posts')
        .select('whop_post_id, points, view_count, likes_count, reply_count')
        .eq('whop_post_id', post.id)
        .single();
      
      // Extract engagement metrics from API response
      const viewCount = post.view_count || 0;
      const likeCount = post.like_count || 0;
      const commentCount = post.comment_count || 0;
      const isPinned = post.is_pinned || false;
      const contentLength = post.content?.length || 0;
      
      // Calculate points using new system
      const { points, breakdown } = calculateForumPostPoints(
        viewCount,
        commentCount,
        likeCount,
        isPinned,
        contentLength
      );
      
      console.log(`🔢 Post ${post.id} calculated:`, {
        points,
        views: viewCount,
        comments: commentCount,
        likes: likeCount,
        pinned: isPinned,
        contentLength: contentLength,
        breakdown
      });

      if (existing) {
        // Check if any metrics changed (not just points)
        const metricsChanged = 
          existing.points !== points ||
          existing.view_count !== viewCount ||
          existing.likes_count !== likeCount ||
          existing.reply_count !== commentCount;
        
        if (metricsChanged) {
          await supabase
            .from('posts')
            .update({
              view_count: viewCount,
              likes_count: likeCount,
              reply_count: commentCount,
              poll_votes_count: 0, // Forums don't have polls
              points: points,
              points_breakdown: breakdown,
              is_pinned: isPinned,
              // updated_at will use PostgreSQL default on UPDATE
            })
            .eq('whop_post_id', post.id);
          
          console.log(`✅ Updated post ${post.id}: views=${viewCount}, likes=${likeCount}, replies=${commentCount}, points=${points}`);
          
          // Update user's leaderboard points when metrics change
          await updateUserPoints(post.user.id, communityId);
        } else {
          console.log(`⏭️  Skipped post ${post.id}: no changes`);
        }
        skipped++;
      } else {
        // Insert new post
        // Upsert user data (insert new or update existing)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .upsert({
            whop_user_id: post.user.id,
            username: post.user.name || post.user.username,
            avatar_url: post.user.profile_picture?.source_url,
          }, {
            onConflict: 'whop_user_id',
            ignoreDuplicates: false  // Always update existing records
          })
          .select('whop_user_id')
          .single();

        if (userError) {
          console.error('❌ Failed to upsert user:', userError);
        }

        const whopUserId = userData?.whop_user_id;

        // Also ensure user is in community_members (skip if already exists)
        await supabase
          .from('community_members')
          .upsert({
            whop_user_id: whopUserId,
            whop_company_id: communityId,
          }, {
            onConflict: 'whop_user_id,whop_company_id',
            ignoreDuplicates: true  // Don't update, just skip if exists
          });

        // Insert post
        // NOTE: Whop API does NOT return created_at/updated_at for forum posts
        // We'll let PostgreSQL use default CURRENT_TIMESTAMP
        const { data: insertedPost, error: insertError } = await supabase
          .from('posts')
          .insert({
            whop_post_id: post.id,
            whop_user_id: whopUserId,
            whop_company_id: communityId,
            experience_id: forumExperienceId,
            content: post.content,
            rich_content: post.rich_content,
            post_type: 'forum',
            parent_id: post.parent_id,
            view_count: viewCount,
            likes_count: likeCount,
            reply_count: commentCount,
            poll_votes_count: 0, // Forums don't have polls
            is_pinned: isPinned,
            points: points,
            points_breakdown: breakdown,
            // created_at and updated_at will use PostgreSQL defaults
          })
          .select();

        if (insertError) {
          console.error('❌ Error inserting forum post:', insertError);
          throw insertError;
        }

        console.log(`✅ New forum post: ${points} points - "${post.content?.substring(0, 50) || ''}..."`);
        synced++;

        // Update user's total points
        await updateUserPoints(whopUserId, communityId);
      }
    }

    console.log(`✅ Forum sync complete: ${synced} new, ${skipped} existing`);
    return { synced, skipped };

  } catch (error) {
    console.error('❌ Forum sync error:', error);
    throw error;
  }
}

/**
 * Sync chat messages from Whop
 */
export async function syncChatMessages(communityId, chatExperienceId) {
  console.log(`\n🔄 Syncing chat messages for community: ${communityId}`);
  
  try {
    // Fetch chat messages from Whop
    // SDK method: client.messages.list({ channel_id })
    // The experience_id IS the channel_id for chat experiences
    const messages = [];
    
    for await (const message of whopSdk.messages.list({ channel_id: chatExperienceId })) {
      messages.push(message);
    }

    console.log(`Found ${messages.length} chat messages`);

    let synced = 0;
    let skipped = 0;

    for (const message of messages) {
      // Check if message already exists
      const { data: existing } = await supabase
        .from('posts')
        .select('whop_post_id, points, view_count, likes_count, reply_count, poll_votes_count')
        .eq('whop_post_id', message.id)
        .single();

      // Extract engagement metrics from API
      const isPinned = message.is_pinned || false;
      
      // Count replies (messages replying to this message)
      const replyCount = messages.filter(m => m.replying_to_message_id === message.id).length;
      
      // Sum all reaction counts
      const reactionCount = (message.reaction_counts || []).reduce((sum, reaction) => sum + (reaction.count || 0), 0);
      
      // Sum all poll votes
      const pollVotesCount = (message.poll_votes || []).reduce((sum, vote) => sum + (vote.count || 0), 0);

      // Calculate points using new system
      const { points, breakdown } = calculateChatMessagePoints(
        replyCount,
        reactionCount,
        pollVotesCount,
        isPinned
      );

      console.log(`🔢 Message ${message.id} calculated:`, {
        points,
        replies: replyCount,
        reactions: reactionCount,
        pollVotes: pollVotesCount,
        pinned: isPinned,
        breakdown
      });

      if (existing) {
        // Check if any metrics changed (not just points)
        const metricsChanged = 
          existing.points !== points ||
          existing.view_count !== (message.view_count || 0) ||
          existing.likes_count !== reactionCount ||
          existing.reply_count !== replyCount ||
          existing.poll_votes_count !== pollVotesCount;
        
        if (metricsChanged) {
          await supabase
            .from('posts')
            .update({
              view_count: message.view_count || 0,
              likes_count: reactionCount,
              reply_count: replyCount,
              poll_votes_count: pollVotesCount,
              points: points,
              points_breakdown: breakdown,
              is_pinned: isPinned,
              updated_at: message.updated_at, // Already ISO 8601 string
            })
            .eq('whop_post_id', message.id);
          
          console.log(`✅ Updated message ${message.id}: views=${message.view_count || 0}, reactions=${reactionCount}, replies=${replyCount}, points=${points}`);
          
          // Update user's leaderboard points when message metrics change
          await updateUserPoints(message.user.id, communityId);
        } else {
          console.log(`⏭️  Skipped message ${message.id}: no changes`);
        }
        skipped++;
      } else {
        // Upsert user data (insert new or update existing)
        const { data: userData } = await supabase
          .from('users')
          .upsert({
            whop_user_id: message.user.id,
            username: message.user.name || message.user.username,
            avatar_url: message.user.profile_picture?.source_url,
          }, {
            onConflict: 'whop_user_id',
            ignoreDuplicates: false  // Always update existing records
          })
          .select('whop_user_id')
          .single();

        const whopUserId = userData?.whop_user_id;

        // Also ensure user is in community_members (skip if already exists)
        await supabase
          .from('community_members')
          .upsert({
            whop_user_id: whopUserId,
            whop_company_id: communityId,
          }, {
            onConflict: 'whop_user_id,whop_company_id',
            ignoreDuplicates: true  // Don't update, just skip if exists
          });

        // Insert message
        // NOTE: Whop API returns created_at/updated_at as ISO 8601 strings for messages
        await supabase
          .from('posts')
          .insert({
            whop_post_id: message.id,
            whop_user_id: whopUserId,
            whop_company_id: communityId,
            experience_id: chatExperienceId,
            content: message.content,
            rich_content: message.rich_content,
            post_type: 'chat',
            parent_id: message.replying_to_message_id,
            view_count: message.view_count || 0,
            likes_count: reactionCount,
            reply_count: replyCount,
            poll_votes_count: pollVotesCount,
            is_pinned: isPinned,
            points: points,
            points_breakdown: breakdown,
            created_at: message.created_at, // Already ISO 8601 string
            updated_at: message.updated_at, // Already ISO 8601 string
          });

        console.log(`✅ New chat message: ${points} points`);
        synced++;

        // Update user's total points
        await updateUserPoints(whopUserId, communityId);
      }
    }

    console.log(`✅ Chat sync complete: ${synced} new, ${skipped} existing`);
    return { synced, skipped };

  } catch (error) {
    console.error('❌ Chat sync error:', error);
    throw error;
  }
}

/**
 * Update user's total points and leaderboard entry
 */
async function updateUserPoints(whopUserId, communityId) {
  // Fixed period_start for all period types
  const fixedPeriodStart = '2025-01-01';
  const now = new Date();

  const periods = ['all_time', 'weekly', 'monthly'];
  
  for (const period of periods) {
    // Calculate date threshold based on period type
    let dateThreshold;
    
    if (period === 'weekly') {
      // Last 7 days
      dateThreshold = new Date(now);
      dateThreshold.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
      // Last 30 days
      dateThreshold = new Date(now);
      dateThreshold.setDate(now.getDate() - 30);
    } else {
      // all_time: no date filter, count all posts
      dateThreshold = null;
    }

    // Build query to get posts within the period
    let query = supabase
      .from('posts')
      .select('points, created_at')
      .eq('whop_user_id', whopUserId)
      .eq('whop_company_id', communityId);
    
    // Apply date filter if needed
    if (dateThreshold) {
      query = query.gte('created_at', dateThreshold.toISOString());
    }
    
    const { data: posts } = await query;

    // Fix floating point precision errors by rounding to 1 decimal
    // Convert each point to Number first to ensure proper arithmetic
    const periodPoints = Math.round((posts?.reduce((sum, post) => sum + (Number(post.points) || 0), 0) || 0) * 10) / 10;

    console.log(`💰 Updating ${period} points for user ${whopUserId}:`, {
      postsCount: posts?.length || 0,
      periodPoints
    });
    
    // Upsert leaderboard entry (rank will be calculated after all users are updated)
    await supabase
      .from('leaderboard_entries')
      .upsert({
        whop_user_id: whopUserId,
        whop_company_id: communityId,
        period_type: period,
        period_start: fixedPeriodStart,
        points: periodPoints,
        updated_at: new Date(),
      }, {
        onConflict: 'whop_user_id,whop_company_id,period_type,period_start'
      });
  }
}

/**
 * Recalculate ranks for all users in a community
 * Must be called AFTER all points are updated
 */
async function recalculateRanks(communityId) {
  const periods = ['all_time', 'weekly', 'monthly'];
  const fixedPeriodStart = '2025-01-01';
  
  for (const period of periods) {
    // Get all entries for this period and period_start, ordered by points
    const { data: entries } = await supabase
      .from('leaderboard_entries')
      .select('whop_user_id, points')
      .eq('whop_company_id', communityId)
      .eq('period_type', period)
      .eq('period_start', fixedPeriodStart)
      .order('points', { ascending: false });
    
    if (!entries || entries.length === 0) continue;
    
    // Update rank for each entry
    for (let i = 0; i < entries.length; i++) {
      const rank = i + 1; // 1-based ranking
      await supabase
        .from('leaderboard_entries')
        .update({ rank: rank })
        .eq('whop_user_id', entries[i].whop_user_id)
        .eq('whop_company_id', communityId)
        .eq('period_type', period)
        .eq('period_start', fixedPeriodStart);
    }
    
    console.log(`   ✅ ${period}: Updated ranks for ${entries.length} users`);
  }
}

/**
 * Sync all engagement for a community
 * Handles multiple forum and chat experiences
 */
export async function syncCommunityEngagement(communityId, forumExperiences = [], chatExperiences = []) {
  console.log(`\n🚀 Starting full sync for community: ${communityId}`);
  console.log(`   Forums to sync: ${forumExperiences.length}`);
  console.log(`   Chats to sync: ${chatExperiences.length}`);
  
  const results = {
    forums: [],
    chats: [],
    totals: {
      forumsSynced: 0,
      forumsSkipped: 0,
      chatsSynced: 0,
      chatsSkipped: 0
    }
  };

  // Sync all forum experiences
  for (const forum of forumExperiences) {
    console.log(`\n📋 Syncing forum: ${forum.name} (${forum.id})`);
    try {
      const forumResult = await syncForumPosts(communityId, forum.id);
      results.forums.push({
        experienceId: forum.id,
        name: forum.name,
        ...forumResult
      });
      results.totals.forumsSynced += forumResult.synced;
      results.totals.forumsSkipped += forumResult.skipped;
    } catch (error) {
      console.error(`❌ Failed to sync forum ${forum.name}:`, error.message);
      results.forums.push({
        experienceId: forum.id,
        name: forum.name,
        error: error.message
      });
    }
  }

  // Sync all chat experiences
  for (const chat of chatExperiences) {
    console.log(`\n💬 Syncing chat: ${chat.name} (${chat.id})`);
    try {
      const chatResult = await syncChatMessages(communityId, chat.id);
      results.chats.push({
        experienceId: chat.id,
        name: chat.name,
        ...chatResult
      });
      results.totals.chatsSynced += chatResult.synced;
      results.totals.chatsSkipped += chatResult.skipped;
    } catch (error) {
      console.error(`❌ Failed to sync chat ${chat.name}:`, error.message);
      results.chats.push({
        experienceId: chat.id,
        name: chat.name,
        error: error.message
      });
    }
  }

  console.log(`\n✅ Community sync complete:`, results.totals);
  
  // Recalculate leaderboard for all users who have posts
  try {
    console.log(`\n📊 Recalculating leaderboard points...`);
    
    // Get all unique users who have posts in this community
    const { data: postsData } = await supabase
      .from('posts')
      .select('whop_user_id')
      .eq('whop_company_id', communityId);
    
    const uniqueUsers = [...new Set(postsData?.map(p => p.whop_user_id) || [])];
    
    console.log(`   Found ${uniqueUsers.length} users with posts`);
    
    // Update leaderboard for each user
    for (const userId of uniqueUsers) {
      await updateUserPoints(userId, communityId);
    }
    
    console.log(`✅ Leaderboard updated for ${uniqueUsers.length} users`);
    
    // Recalculate ranks for all periods
    console.log(`\n🏆 Recalculating ranks...`);
    await recalculateRanks(communityId);
    console.log(`✅ Ranks updated`);
  } catch (error) {
    console.error('❌ Failed to update leaderboard:', error.message);
  }
  
  // Calculate streaks for all users in this community
  try {
    console.log(`\n🔥 Calculating activity streaks...`);
    await calculateStreaksForCommunity(communityId);
  } catch (error) {
    console.error('❌ Failed to calculate streaks:', error.message);
  }
  
  return results;
}

/**
 * Calculate activity streaks for all users in a community
 * Streak = consecutive days with at least 1 post (forum or chat)
 */
async function calculateStreaksForCommunity(communityId) {
  // Get all users who have posted in this community
  const { data: posts } = await supabase
    .from('posts')
    .select('whop_user_id, created_at')
    .eq('whop_company_id', communityId)
    .order('created_at', { ascending: false });

  if (!posts || posts.length === 0) {
    console.log('No posts found for streak calculation');
    return;
  }

  // Group posts by user
  const userPosts = {};
  posts.forEach(post => {
    if (!userPosts[post.whop_user_id]) {
      userPosts[post.whop_user_id] = [];
    }
    userPosts[post.whop_user_id].push(new Date(post.created_at));
  });

  // Calculate streaks for each user
  for (const [userId, postDates] of Object.entries(userPosts)) {
    const { currentStreak, longestStreak } = calculateStreakFromDates(postDates);
    
    // Upsert streak data
    const { error } = await supabase
      .from('daily_streaks')
      .upsert({
        whop_user_id: userId,
        whop_company_id: communityId,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: postDates[0].toISOString().split('T')[0]
      }, {
        onConflict: 'whop_user_id,whop_company_id'
      });

    if (error) {
      console.error(`Failed to update streak for user ${userId}:`, error.message);
    } else {
      console.log(`✅ Updated streak for user ${userId}: Current=${currentStreak}, Longest=${longestStreak}`);
    }
  }
}

/**
 * Calculate current and longest streak from an array of dates
 * @param {Date[]} dates - Array of post dates (should be sorted newest first)
 * @returns {{currentStreak: number, longestStreak: number}}
 */
function calculateStreakFromDates(dates) {
  if (!dates || dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get unique days (ignore time) - dates are already Date objects
  const uniqueDays = [...new Set(dates.map(d => d.toISOString().split('T')[0]))].sort().reverse();
  
  // Use UTC to avoid timezone issues
  const today = new Date();
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  
  // Check if user posted today or yesterday (streak is still active)
  const lastPostDateStr = uniqueDays[0]; // e.g., "2025-01-18"
  const [year, month, day] = lastPostDateStr.split('-').map(Number);
  const lastPostUTC = Date.UTC(year, month - 1, day); // month is 0-indexed
  
  const daysSinceLastPost = Math.floor((todayUTC - lastPostUTC) / (1000 * 60 * 60 * 24));
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // If last post was today or yesterday, calculate current streak
  if (daysSinceLastPost <= 1) {
    currentStreak = 1;
    let expectedDate = new Date(lastPostDateStr + 'T00:00:00Z'); // Force UTC
    
    for (let i = 1; i < uniqueDays.length; i++) {
      expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      if (uniqueDays[i] === expectedDateStr) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  tempStreak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prevDate = new Date(uniqueDays[i - 1] + 'T00:00:00Z');
    const currDate = new Date(uniqueDays[i] + 'T00:00:00Z');
    const daysDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return { currentStreak, longestStreak };
}
