# Supabase Schema Analysis & Recommendations

**Date:** January 2025  
**Analysis Type:** Functional alignment review for community engagement leaderboard

---

## Executive Summary

The current Supabase schema has **11 tables** that mostly align well with the app's requirements. The schema successfully supports:
- ✅ Community-specific engagement tracking
- ✅ Skool-like point system infrastructure
- ✅ Customizable level names per community
- ✅ Prize pools and payouts
- ✅ UUID-based IDs (no MongoDB ObjectID issues)

However, there are **3 critical issues** that need fixing to ensure proper functionality:

1. **Users table mixes global and community-specific data** (points/levels should be per-community)
2. **Missing indexes** for common query patterns
3. **Missing unique constraints** to prevent duplicate data

---

## Current Schema Overview

### 1. **communities** (Core community data)
```
- id: uuid (PK)
- whop_community_id: text (unique)
- name: text
- owner_whop_user_id: text
- settings: jsonb
- level_names: jsonb (default has Level 1-10) ✅
- created_at: timestamptz
- updated_at: timestamptz
```
**Status:** ✅ Good - Has level_names for customization

---

### 2. **users** (Global user data)
```
- id: uuid (PK)
- whop_user_id: text (unique)
- username: text
- avatar_url: text
- total_points: integer (default 0) ⚠️ ISSUE
- current_level: integer (default 1) ⚠️ ISSUE
- created_at: timestamptz
- updated_at: timestamptz
```
**Issues:**
- `total_points` and `current_level` are GLOBAL but should be PER-COMMUNITY
- A user in multiple communities will have different points/levels in each
- This breaks the multi-community design

**Fix:** Remove these fields and calculate from `leaderboard_entries` per community

---

### 3. **community_members** (User-community relationship)
```
- id: uuid (PK)
- user_id: uuid (FK -> users)
- community_id: uuid (FK -> communities)
- joined_at: timestamptz
```
**Status:** ✅ Good
**Missing:** Unique constraint on (user_id, community_id) to prevent duplicate memberships

---

### 4. **posts** (Community posts)
```
- id: uuid (PK)
- user_id: uuid (FK -> users)
- community_id: uuid (FK -> communities)
- content: text
- created_at: timestamptz
- updated_at: timestamptz
```
**Status:** ✅ Good - Community-specific

---

### 5. **comments** (Comments on posts)
```
- id: uuid (PK)
- post_id: uuid (FK -> posts)
- user_id: uuid (FK -> users)
- community_id: uuid (FK -> communities)
- content: text
- created_at: timestamptz
```
**Status:** ✅ Good - Community-specific

---

### 6. **likes** (Likes on posts/comments)
```
- id: uuid (PK)
- target_type: text (CHECK: 'post' or 'comment')
- target_id: uuid
- user_id: uuid (FK -> users)
- community_id: uuid (FK -> communities)
- created_at: timestamptz
```
**Status:** ✅ Good - Supports Skool's point system (1 like = 1 point)
**Missing:** Unique constraint on (user_id, target_type, target_id) to prevent duplicate likes

---

### 7. **daily_streaks** (User activity streaks)
```
- id: uuid (PK)
- user_id: uuid (FK -> users)
- community_id: uuid (FK -> communities)
- current_streak: integer (default 0)
- longest_streak: integer (default 0)
- last_activity_date: date
```
**Status:** ✅ Good - Community-specific
**Missing:** Unique constraint on (user_id, community_id) to prevent duplicates

---

### 8. **leaderboard_entries** (Periodic leaderboard snapshots)
```
- id: uuid (PK)
- user_id: uuid (FK -> users)
- community_id: uuid (FK -> communities)
- period_type: text (CHECK: 'weekly', 'monthly', 'all_time')
- period_start: date
- period_end: date (nullable)
- points: integer (default 0)
- rank: integer
- engagement_generated: integer (default 0)
- created_at: timestamptz
- updated_at: timestamptz
```
**Status:** ✅ Good - Can store all-time, weekly, monthly stats per community
**Note:** `engagement_generated` seems redundant if points = likes received. Clarify usage.
**Missing:** Index on (community_id, period_type, points DESC) for leaderboard queries

---

### 9. **prize_pools** (Community prize pools)
```
- id: uuid (PK)
- community_id: uuid (FK -> communities)
- amount: numeric
- currency: text (default 'USD')
- period_start: date
- period_end: date
- status: text (CHECK: 'active', 'completed', 'paid_out')
- created_at: timestamptz
```
**Status:** ✅ Good

---

### 10. **payouts** (User payouts from prize pools)
```
- id: uuid (PK)
- prize_pool_id: uuid (FK -> prize_pools)
- user_id: uuid (FK -> users)
- community_id: uuid (FK -> communities)
- amount: numeric
- rank: integer
- status: text (CHECK: 'pending', 'processing', 'completed', 'failed')
- whop_payment_id: text
- created_at: timestamptz
- paid_at: timestamptz
```
**Status:** ✅ Good

---

### 11. **user_points_history** (Individual point-earning actions)
```
- id: uuid (PK)
- user_id: uuid (FK -> users)
- community_id: uuid (FK -> communities)
- action_type: text
- target_type: text
- target_id: uuid
- points_earned: integer (default 1)
- created_at: timestamptz
```
**Status:** ✅ Good - Tracks each like/engagement action for points
**Note:** Can be used to audit point calculations

---

## Critical Issues to Fix

### Issue #1: Users table has global points/levels (should be per-community)

**Problem:**
```sql
users.total_points and users.current_level are global
```

**Impact:**
- A user in 5 communities will have 1 global point total (incorrect)
- Points should be separate per community
- Levels should be calculated per community based on that community's points

**Solution:**
Remove `total_points` and `current_level` from users table. Use `leaderboard_entries` with `period_type='all_time'` to track per-community stats.

**Migration:**
```sql
-- Remove global point/level tracking from users
ALTER TABLE users DROP COLUMN total_points;
ALTER TABLE users DROP COLUMN current_level;
```

---

### Issue #2: Missing indexes for common queries

**Impact:** Slow queries on leaderboards, user lookups, etc.

**Fix:** Add indexes for:
1. Leaderboard queries (community_id + period + points)
2. User lookups by whop_user_id
3. Community lookups by whop_community_id
4. Likes by target
5. Daily streaks by user+community

**Migration:**
```sql
-- Leaderboard queries
CREATE INDEX idx_leaderboard_community_period_points 
ON leaderboard_entries(community_id, period_type, points DESC);

-- User lookups
CREATE INDEX idx_users_whop_user_id ON users(whop_user_id);

-- Community lookups
CREATE INDEX idx_communities_whop_community_id ON communities(whop_community_id);

-- Likes by target
CREATE INDEX idx_likes_target ON likes(target_type, target_id);

-- Community members lookup
CREATE INDEX idx_community_members_lookup 
ON community_members(user_id, community_id);

-- Daily streaks lookup
CREATE INDEX idx_daily_streaks_lookup 
ON daily_streaks(user_id, community_id);

-- User points history by community
CREATE INDEX idx_user_points_history_lookup 
ON user_points_history(user_id, community_id, created_at DESC);
```

---

### Issue #3: Missing unique constraints

**Impact:** Can create duplicate likes, streaks, memberships

**Fix:** Add unique constraints to prevent duplicates

**Migration:**
```sql
-- Prevent duplicate community memberships
ALTER TABLE community_members 
ADD CONSTRAINT unique_user_community 
UNIQUE(user_id, community_id);

-- Prevent duplicate likes
ALTER TABLE likes 
ADD CONSTRAINT unique_user_like 
UNIQUE(user_id, target_type, target_id);

-- Prevent duplicate streak records
ALTER TABLE daily_streaks 
ADD CONSTRAINT unique_user_community_streak 
UNIQUE(user_id, community_id);
```

---

## Schema-App Alignment Check

### ✅ Leaderboard Page Requirements
- [x] Fetch top users per community - `leaderboard_entries`
- [x] Show user's rank - `leaderboard_entries`
- [x] Display prize pool - `prize_pools`
- [x] Community-specific data - All tables have `community_id`

### ✅ User Stats Page Requirements
- [x] Total points per community - `leaderboard_entries` (all_time)
- [x] Current rank - `leaderboard_entries.rank`
- [x] Streaks - `daily_streaks`
- [x] Engagement metrics - `user_points_history`
- [x] Past earnings - `payouts`

### ✅ Admin Dashboard Requirements
- [x] Create prize pools - `prize_pools`
- [x] View community stats - Aggregate from various tables
- [x] Process payouts - `payouts`
- [x] Customize level names - `communities.level_names`

### ✅ Skool Point System Support
- [x] 1 like = 1 point - `likes` table + `user_points_history`
- [x] 10 level system - Calculated in `lib/points-system.js`
- [x] Custom level names - `communities.level_names` (JSONB)
- [x] Community-specific tracking - All tables have `community_id`

---

## Recommendations Summary

### 🔴 Critical (Must Fix)
1. ✅ **Remove global points/levels from users table** - Use leaderboard_entries instead
2. ✅ **Add indexes** for query performance
3. ✅ **Add unique constraints** to prevent duplicates

### 🟡 Optional (Nice to Have)
4. Clarify `engagement_generated` vs `points` in leaderboard_entries
5. Add cascade delete rules for foreign keys
6. Consider adding `updated_at` triggers for auto-updates

---

## Migration Script (Complete Fix)

```sql
-- CRITICAL FIX #1: Remove global point tracking
ALTER TABLE users DROP COLUMN IF EXISTS total_points;
ALTER TABLE users DROP COLUMN IF EXISTS current_level;

-- CRITICAL FIX #2: Add indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_community_period_points 
ON leaderboard_entries(community_id, period_type, points DESC);

CREATE INDEX IF NOT EXISTS idx_users_whop_user_id 
ON users(whop_user_id);

CREATE INDEX IF NOT EXISTS idx_communities_whop_community_id 
ON communities(whop_community_id);

CREATE INDEX IF NOT EXISTS idx_likes_target 
ON likes(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_community_members_lookup 
ON community_members(user_id, community_id);

CREATE INDEX IF NOT EXISTS idx_daily_streaks_lookup 
ON daily_streaks(user_id, community_id);

CREATE INDEX IF NOT EXISTS idx_user_points_history_lookup 
ON user_points_history(user_id, community_id, created_at DESC);

-- CRITICAL FIX #3: Add unique constraints
ALTER TABLE community_members 
ADD CONSTRAINT IF NOT EXISTS unique_user_community 
UNIQUE(user_id, community_id);

ALTER TABLE likes 
ADD CONSTRAINT IF NOT EXISTS unique_user_like 
UNIQUE(user_id, target_type, target_id);

ALTER TABLE daily_streaks 
ADD CONSTRAINT IF NOT EXISTS unique_user_community_streak 
UNIQUE(user_id, community_id);
```

---

## Final Notes

The schema is fundamentally sound and well-designed for the app's requirements. The three critical fixes will ensure:
1. ✅ **Proper multi-community support** (points per community, not global)
2. ✅ **Fast query performance** (proper indexes)
3. ✅ **Data integrity** (no duplicate likes, streaks, memberships)

After applying these fixes, the schema will be production-ready for the community engagement leaderboard system.

---

## Next Steps

1. Review and approve this analysis
2. Apply the migration script to Supabase
3. Update API routes to use leaderboard_entries for per-community stats
4. Add seed data for testing
5. Test all three screens (leaderboard, stats, admin) with real queries
