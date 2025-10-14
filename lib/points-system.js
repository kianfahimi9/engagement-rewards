/**
 * Engagement-Based Points System (Modified for Whop API)
 * 
 * Core Rule: Points awarded based on engagement RECEIVED (views + replies)
 * - Forum Posts: (Views × 0.1) + (Replies × 1) [PRIMARY]
 * - Chat Messages: (Replies × 0.5) [LIGHT TRACKING]
 * 
 * Anti-spam filters applied to prevent gaming the system
 */

// Skool's exact level thresholds (kept for progression)
export const LEVEL_THRESHOLDS = {
  1: 0,
  2: 5,
  3: 20,
  4: 65,
  5: 155,
  6: 515,
  7: 2015,
  8: 8015,
  9: 33015,
  10: 100000,
};

// Point values (engagement-based)
export const POINT_VALUES = {
  // Forum posts (main points)
  FORUM_VIEW: 0.1,
  FORUM_REPLY: 1,
  
  // Chat messages (light tracking)
  CHAT_REPLY: 0.5,
  
  // Bonuses
  PINNED_CONTENT: 10,
  MENTION_BONUS: 0.5,
};

// Anti-spam thresholds
export const SPAM_FILTERS = {
  MIN_CONTENT_LENGTH: 10,
  MIN_VIEWS_TO_COUNT: 5,
  MIN_REPLY_TIME_GAP: 30000, // 30 seconds in ms
};

/**
 * Calculate user level based on total points
 * @param {number} points - Total points accumulated
 * @returns {number} - Current level (1-10)
 */
export function calculateLevel(points) {
  if (points >= LEVEL_THRESHOLDS[10]) return 10;
  if (points >= LEVEL_THRESHOLDS[9]) return 9;
  if (points >= LEVEL_THRESHOLDS[8]) return 8;
  if (points >= LEVEL_THRESHOLDS[7]) return 7;
  if (points >= LEVEL_THRESHOLDS[6]) return 6;
  if (points >= LEVEL_THRESHOLDS[5]) return 5;
  if (points >= LEVEL_THRESHOLDS[4]) return 4;
  if (points >= LEVEL_THRESHOLDS[3]) return 3;
  if (points >= LEVEL_THRESHOLDS[2]) return 2;
  return 1;
}

/**
 * Get points needed for next level
 * @param {number} currentPoints - Current total points
 * @returns {object} - { currentLevel, nextLevel, pointsNeeded, progressPercent }
 */
export function getNextLevelInfo(currentPoints) {
  const currentLevel = calculateLevel(currentPoints);
  
  if (currentLevel === 10) {
    return {
      currentLevel: 10,
      nextLevel: 10,
      pointsNeeded: 0,
      progressPercent: 100,
      isMaxLevel: true
    };
  }
  
  const nextLevel = currentLevel + 1;
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel];
  const nextThreshold = LEVEL_THRESHOLDS[nextLevel];
  const pointsNeeded = nextThreshold - currentPoints;
  const pointsIntoCurrentLevel = currentPoints - currentThreshold;
  const pointsRequiredForLevel = nextThreshold - currentThreshold;
  const progressPercent = (pointsIntoCurrentLevel / pointsRequiredForLevel) * 100;
  
  return {
    currentLevel,
    nextLevel,
    pointsNeeded,
    progressPercent: Math.round(progressPercent),
    currentThreshold,
    nextThreshold,
    isMaxLevel: false
  };
}

/**
 * Calculate points for a forum post based on engagement received
 * @param {object} post - Forum post object from Whop
 * @param {array} allPosts - All posts (to count replies)
 * @returns {object} - { points, breakdown }
 */
export function calculateForumPostPoints(post, allPosts = []) {
  const breakdown = {
    views: 0,
    replies: 0,
    bonuses: 0,
    total: 0
  };

  // Anti-spam: Check content length
  if (!post.content || post.content.length < SPAM_FILTERS.MIN_CONTENT_LENGTH) {
    return { points: 0, breakdown, reason: 'Content too short (spam filter)' };
  }

  // Anti-spam: Check minimum views
  if (post.viewCount < SPAM_FILTERS.MIN_VIEWS_TO_COUNT) {
    return { points: 0, breakdown, reason: 'Not enough views yet' };
  }

  // Calculate view points
  breakdown.views = post.viewCount * POINT_VALUES.FORUM_VIEW;

  // Count quality replies (filter spam)
  const qualityReplies = allPosts.filter(p => {
    // Must be replying to this post
    if (p.parentId !== post.id) return false;
    
    // No self-replies
    if (p.user?.id === post.user?.id) return false;
    
    // Check reply time gap (anti-spam)
    const timeDiff = parseInt(p.createdAt) - parseInt(post.createdAt);
    if (timeDiff < SPAM_FILTERS.MIN_REPLY_TIME_GAP) return false;
    
    return true;
  }).length;

  breakdown.replies = qualityReplies * POINT_VALUES.FORUM_REPLY;

  // Bonus: Pinned content
  if (post.isPinned) {
    breakdown.bonuses += POINT_VALUES.PINNED_CONTENT;
  }

  // Bonus: Mentions (engagement indicator)
  if (post.mentionedUserIds && post.mentionedUserIds.length > 0) {
    breakdown.bonuses += post.mentionedUserIds.length * POINT_VALUES.MENTION_BONUS;
  }

  // Total points
  breakdown.total = breakdown.views + breakdown.replies + breakdown.bonuses;

  return {
    points: Math.round(breakdown.total * 10) / 10, // Round to 1 decimal
    breakdown
  };
}

/**
 * Calculate points for a chat message based on replies
 * @param {object} message - Chat message from Whop
 * @param {array} allMessages - All messages (to count replies)
 * @returns {object} - { points, breakdown }
 */
export function calculateChatMessagePoints(message, allMessages = []) {
  const breakdown = {
    replies: 0,
    total: 0
  };

  // Count quality replies
  const qualityReplies = allMessages.filter(m => {
    if (m.replyingToPostId !== message.id) return false;
    if (m.user?.id === message.user?.id) return false;
    
    const timeDiff = parseInt(m.createdAt) - parseInt(message.createdAt);
    if (timeDiff < SPAM_FILTERS.MIN_REPLY_TIME_GAP) return false;
    
    return true;
  }).length;

  breakdown.replies = qualityReplies * POINT_VALUES.CHAT_REPLY;
  breakdown.total = breakdown.replies;

  return {
    points: Math.round(breakdown.total * 10) / 10,
    breakdown
  };
}

/**
 * Calculate leaderboard rank based on points
 * This should be called after sorting users by points descending
 * @param {Array} users - Array of user objects with points
 * @param {string} userId - User ID to find rank for
 * @returns {number} - User's rank (1-based)
 */
export function calculateRank(users, userId) {
  const sortedUsers = [...users].sort((a, b) => b.points - a.points);
  const rank = sortedUsers.findIndex(user => user.id === userId) + 1;
  return rank || users.length + 1;
}

/**
 * Get level badge/title
 * @param {number} level - User level (1-10)
 * @returns {object} - { level, title, emoji }
 */
export function getLevelBadge(level) {
  const badges = {
    1: { level: 1, title: 'Newbie', emoji: '🌱' },
    2: { level: 2, title: 'Member', emoji: '🙂' },
    3: { level: 3, title: 'Regular', emoji: '👍' },
    4: { level: 4, title: 'Contributor', emoji: '🌟' },
    5: { level: 5, title: 'Active', emoji: '⚡' },
    6: { level: 6, title: 'Veteran', emoji: '🔥' },
    7: { level: 7, title: 'Expert', emoji: '💎' },
    8: { level: 8, title: 'Master', emoji: '👑' },
    9: { level: 9, title: 'Legend', emoji: '🏆' },
    10: { level: 10, title: 'Icon', emoji: '⭐' },
  };
  
  return badges[level] || badges[1];
}

/**
 * Validate and sanitize point data
 * @param {number} points - Points to validate
 * @returns {number} - Valid points (non-negative integer)
 */
export function sanitizePoints(points) {
  const sanitized = parseInt(points, 10);
  return isNaN(sanitized) || sanitized < 0 ? 0 : sanitized;
}

// Export all functions and constants
export default {
  LEVEL_THRESHOLDS,
  POINT_VALUES,
  SPAM_FILTERS,
  calculateLevel,
  getNextLevelInfo,
  calculateForumPostPoints,
  calculateChatMessagePoints,
  calculateRank,
  getLevelBadge,
  sanitizePoints,
};
