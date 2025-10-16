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
          
          console.log(`Updated post ${post.id}: ${existing.points} → ${points} points`);
        }
        skipped++;
      } else {
        // Insert new post
        const { data: userData } = await supabase
          .from('users')
          .select('whop_user_id')
          .eq('whop_user_id', post.user.id)
          .single();

        let whopUserId = userData?.whop_user_id;

        // Create user if doesn't exist
        if (!whopUserId) {
          const { data: newUser } = await supabase
            .from('users')
            .insert({
              whop_user_id: post.user.id,
              username: post.user.username || post.user.name,
              avatar_url: post.user.profilePicture?.sourceUrl,
            })
            .select('whop_user_id')
            .single();
          
          whopUserId = newUser?.whop_user_id;
          
          // Also add user to community_members
          await supabase
            .from('community_members')
            .insert({
              whop_user_id: whopUserId,
              whop_company_id: communityId,
            });
        }

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
        // Get or create user
        const { data: userData } = await supabase
          .from('users')
          .select('whop_user_id')
          .eq('whop_user_id', message.user.id)
          .single();

        let whopUserId = userData?.whop_user_id;

        if (!whopUserId) {
          const { data: newUser } = await supabase
            .from('users')
            .insert({
              whop_user_id: message.user.id,
              username: message.user.username || message.user.name,
              avatar_url: message.user.profilePicture?.sourceUrl,
            })
            .select('whop_user_id')
            .single();
          
          whopUserId = newUser?.whop_user_id;
          
          // Also add user to community_members
          await supabase
            .from('community_members')
            .insert({
              whop_user_id: whopUserId,
              whop_company_id: communityId,
            });
        }

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
 */
export async function syncCommunityEngagement(communityId, forumExperienceId, chatExperienceId) {
  console.log(`\n🚀 Starting full sync for community: ${communityId}`);
  
  const results = {
    forum: { synced: 0, skipped: 0 },
    chat: { synced: 0, skipped: 0 },
  };

  // Sync forum posts first (main points)
  if (forumExperienceId) {
    results.forum = await syncForumPosts(communityId, forumExperienceId);
  }

  // Then sync chat (light tracking)
  if (chatExperienceId) {
    results.chat = await syncChatMessages(communityId, chatExperienceId);
  }

  console.log(`\n✅ Community sync complete:`, results);
  return results;
}
