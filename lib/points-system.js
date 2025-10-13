/**
 * Skool Points System Implementation
 * 
 * Core Rule: 1 LIKE = 1 POINT (awarded to content creator)
 * Points are earned when others like your posts, comments, or replies
 */

// Skool's exact level thresholds
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
  10: 100000, // Estimated based on exponential pattern
};

// Point values (keeping it simple like Skool)
export const POINT_VALUES = {
  LIKE_RECEIVED: 1, // The only way to earn points in Skool
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
 * Calculate points for a user based on likes received
 * This is the main point calculation function
 * @param {number} likesReceived - Total likes on user's content
 * @returns {number} - Total points
 */
export function calculatePoints(likesReceived) {
  return likesReceived * POINT_VALUES.LIKE_RECEIVED;
}

/**
 * Get engagement score (for leaderboard ranking)
 * In Skool, this is simply the number of likes received
 * @param {number} likesReceived - Total likes received
 * @returns {number} - Engagement score
 */
export function calculateEngagementScore(likesReceived) {
  return likesReceived;
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
  calculateLevel,
  getNextLevelInfo,
  calculatePoints,
  calculateEngagementScore,
  calculateRank,
  getLevelBadge,
  sanitizePoints,
};
