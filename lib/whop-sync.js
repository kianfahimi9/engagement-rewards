/**
 * Whop Engagement Sync Service
 * 
 * Polls Whop API for forum posts and chat messages
 * Calculates points and updates Supabase
 */

import { whopSdk } from '@/lib/whop-sdk';
import { calculateForumPostPoints, calculateChatMessagePoints } from '@/lib/points-system';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Use anon key since RLS is not enabled
);

/**
 * Sync forum posts from Whop
 */
export async function syncForumPosts(communityId, forumExperienceId) {
  console.log(`\n🔄 Syncing forum posts for community: ${communityId}`);
  
  try {
    // Fetch forum posts from Whop
    const response = await whopSdk.forums.listForumPostsFromForum({
      experienceId: forumExperienceId,
    });

    if (!response || !response.posts) {
      console.log('No forum posts found');
      return { synced: 0, skipped: 0 };
    }

    const posts = response.posts;
    console.log(`Found ${posts.length} forum posts`);

    let synced = 0;
    let skipped = 0;

    for (const post of posts) {
      // Check if post already exists
      const { data: existing } = await supabase
        .from('posts')
        .select('whop_post_id, points')
        .eq('whop_post_id', post.id)
        .single();

      // Calculate points
      const { points, breakdown } = calculateForumPostPoints(post, posts);
      
      console.log(`🔢 Post ${post.id} points calculated:`, {
        points,
        views: post.viewCount,
        replies: post.stats?.replyCount || 0,
        breakdown
      });

      if (existing) {
        // Update if points changed
        if (existing.points !== points) {
          await supabase
            .from('posts')
            .update({
              view_count: post.viewCount,
              points: points,
              points_breakdown: breakdown,
              updated_at: new Date(parseInt(post.updatedAt)),
            })
            .eq('whop_post_id', post.id);
          
          console.log(`✅ Updated post ${post.id}: ${existing.points} → ${points} points`);
        } else {
          console.log(`⏭️  Skipped post ${post.id}: points unchanged (${points})`);
        }
        skipped++;
      } else {
        // Insert new post
        // Log user data to debug
        console.log('📝 User data from Whop:', {
          id: post.user.id,
          name: post.user.name,
          username: post.user.username,
          hasName: !!post.user.name,
          hasUsername: !!post.user.username
        });
        
        // Upsert user data (insert new or update existing)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .upsert({
            whop_user_id: post.user.id,
            username: post.user.name || post.user.username,
            avatar_url: post.user.profilePicture?.sourceUrl,
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
        const { data: insertedPost, error: insertError } = await supabase
          .from('posts')
          .insert({
            whop_post_id: post.id,
            whop_user_id: whopUserId,
            whop_company_id: communityId,
            experience_id: forumExperienceId,
            content: post.content,
            rich_content: post.richContent,
            post_type: 'forum',
            parent_id: post.parentId,
            view_count: post.viewCount,
            is_pinned: post.isPinned,
            points: points,
            points_breakdown: breakdown,
            created_at: new Date(parseInt(post.createdAt)),
            updated_at: new Date(parseInt(post.updatedAt)),
          })
          .select();

        if (insertError) {
          console.error('❌ Error inserting forum post:', insertError);
          throw insertError;
        }

        console.log(`✅ New forum post: ${points} points - "${post.content.substring(0, 50)}..."`);
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
    const response = await whopSdk.messages.listMessagesFromChat({
      chatExperienceId: chatExperienceId,
    });

    if (!response || !response.posts) {
      console.log('No chat messages found');
      return { synced: 0, skipped: 0 };
    }

    const messages = response.posts;
    console.log(`Found ${messages.length} chat messages`);

    let synced = 0;
    let skipped = 0;

    for (const message of messages) {
      // Check if message already exists
      const { data: existing } = await supabase
        .from('posts')
        .select('whop_post_id, points')
        .eq('whop_post_id', message.id)
        .single();

      // Calculate points (light tracking for chat)
      const { points, breakdown } = calculateChatMessagePoints(message, messages);

      if (existing) {
        // Update if points changed
        if (existing.points !== points) {
          await supabase
            .from('posts')
            .update({
              view_count: message.viewCount,
              points: points,
              points_breakdown: breakdown,
              updated_at: new Date(parseInt(message.updatedAt)),
            })
            .eq('whop_post_id', message.id);
        }
        skipped++;
      } else {
        // Upsert user data (insert new or update existing)
        const { data: userData } = await supabase
          .from('users')
          .upsert({
            whop_user_id: message.user.id,
            username: message.user.name || message.user.username,
            avatar_url: message.user.profilePicture?.sourceUrl,
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
        await supabase
          .from('posts')
          .insert({
            whop_post_id: message.id,
            whop_user_id: whopUserId,
            whop_company_id: communityId,
            experience_id: chatExperienceId,
            content: message.content,
            rich_content: message.richContent,
            post_type: 'chat',
            parent_id: message.replyingToPostId,
            view_count: message.viewCount,
            is_pinned: message.isPinned,
            points: points,
            points_breakdown: breakdown,
            created_at: new Date(parseInt(message.createdAt)),
            updated_at: new Date(parseInt(message.updatedAt)),
          });

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
  // Calculate total points from all posts
  const { data: posts } = await supabase
    .from('posts')
    .select('points')
    .eq('whop_user_id', whopUserId)
    .eq('whop_company_id', communityId);

  const totalPoints = posts?.reduce((sum, post) => sum + (post.points || 0), 0) || 0;

  const periods = ['all_time', 'weekly', 'monthly'];
  
  for (const period of periods) {
    // Update or create leaderboard entry for each period
    const { data: existing } = await supabase
      .from('leaderboard_entries')
      .select('whop_user_id')
      .eq('whop_user_id', whopUserId)
      .eq('whop_company_id', communityId)
      .eq('period_type', period)
      .single();

    if (existing) {
      await supabase
        .from('leaderboard_entries')
        .update({
          points: totalPoints,
          updated_at: new Date(),
        })
        .eq('whop_user_id', whopUserId)
        .eq('whop_company_id', communityId)
        .eq('period_type', period);
    } else {
      await supabase
        .from('leaderboard_entries')
        .insert({
          whop_user_id: whopUserId,
          whop_company_id: communityId,
          period_type: period,
          period_start: new Date(),
          points: totalPoints,
        });
    }
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

  // Get unique days (ignore time)
  const uniqueDays = [...new Set(dates.map(d => d.toISOString().split('T')[0]))].sort().reverse();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if user posted today or yesterday (streak is still active)
  const lastPostDate = new Date(uniqueDays[0]);
  const daysSinceLastPost = Math.floor((today - lastPostDate) / (1000 * 60 * 60 * 24));
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // If last post was today or yesterday, calculate current streak
  if (daysSinceLastPost <= 1) {
    currentStreak = 1;
    let expectedDate = new Date(uniqueDays[0]);
    
    for (let i = 1; i < uniqueDays.length; i++) {
      expectedDate.setDate(expectedDate.getDate() - 1);
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
    const prevDate = new Date(uniqueDays[i - 1]);
    const currDate = new Date(uniqueDays[i]);
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
