# Clean Database Schema Documentation

**Last Updated:** January 2025  
**Point System:** 
- **Forum Posts:** Views (0.1 pts) + Comments (1 pt) + Likes (1 pt) + Pinned Bonus (10 pts)
- **Chat Messages:** Replies (0.5 pts) + Reactions (0.5 pts) + Poll Votes (0.5 pts) + Pinned Bonus (10 pts)

---

## 📋 Current Tables (8 Total)

### Core Tables

#### 1. **users**
Whop users who participate in communities.

```sql
- id: uuid (PK)
- whop_user_id: text (unique) -- From Whop API
- username: text
- avatar_url: text
- created_at: timestamptz
- updated_at: timestamptz
```

**Note:** No global points/levels. All points are per-community.

---

#### 2. **communities**
Whop communities using this app.

```sql
- id: uuid (PK)
- whop_community_id: text (unique) -- Whop company ID
- name: text
- owner_whop_user_id: text
- settings: jsonb
- level_names: jsonb -- Custom level 1-10 names
- created_at: timestamptz
- updated_at: timestamptz
```

**Example level_names:**
```json
{
  "1": "Newbie",
  "2": "Regular",
  ...
  "10": "Legend"
}
```

---

#### 3. **community_members**
User-community relationships.

```sql
- id: uuid (PK)
- user_id: uuid (FK -> users)
- community_id: uuid (FK -> communities)
- joined_at: timestamptz
```

**Constraint:** `unique(user_id, community_id)` - prevents duplicate memberships

---

### Engagement Tables

#### 4. **posts**
All content (forum posts AND chat messages).

```sql
- id: uuid (PK)
- whop_post_id: text (unique) -- Whop's post/message ID
- user_id: uuid (FK -> users)
- community_id: uuid (FK -> communities)
- content: text -- Plain text
- rich_content: text -- TipTap JSON
- post_type: text -- 'forum' or 'chat'
- parent_id: text -- Whop post ID being replied to (null = top-level)
- view_count: integer (default 0)
- likes_count: integer (default 0) -- NEW: Likes/reactions count
- reply_count: integer (default 0) -- NEW: Comments/replies count
- poll_votes_count: integer (default 0) -- NEW: Poll votes count (chat only)
- is_pinned: boolean (default false)
- points: numeric (default 0) -- Calculated points for this post
- points_breakdown: jsonb -- How points were calculated
- created_at: timestamptz
- updated_at: timestamptz
```

**Points Calculation:**
- **Forum:** `(view_count × 0.1) + (reply_count × 1) + (likes_count × 1) + (is_pinned ? 10 : 0)`
- **Chat:** `(reply_count × 0.5) + (likes_count × 0.5) + (poll_votes_count × 0.5) + (is_pinned ? 10 : 0)`

**Example points_breakdown:**
```json
{
  "views": 5.0,
  "comments": 3,
  "likes": 2,
  "bonuses": 10,
  "total": 20.0
}
```

**Indexes:**
- `idx_posts_whop_post_id` on whop_post_id
- `idx_posts_type_community` on (post_type, community_id)
- `idx_posts_parent` on parent_id

---

#### 5. **daily_streaks**
Track consecutive daily activity per user per community.

```sql
- id: uuid (PK)
- user_id: uuid (FK -> users)
- community_id: uuid (FK -> communities)
- current_streak: integer (default 0)
- longest_streak: integer (default 0)
- last_activity_date: date
```

**Constraint:** `unique(user_id, community_id)`

**Indexes:**
- `idx_daily_streaks_lookup` on (user_id, community_id)

---

### Leaderboard Tables

#### 6. **leaderboard_entries**
Pre-calculated rankings by period.

```sql
- id: uuid (PK)
- user_id: uuid (FK -> users)
- community_id: uuid (FK -> communities)
- period_type: text -- 'weekly', 'monthly', 'all_time'
- period_start: date
- period_end: date (nullable)
- points: integer (default 0) -- Sum of all post.points
- rank: integer (nullable) -- Position in leaderboard
- engagement_generated: integer (default 0) -- Reserved for future use
- created_at: timestamptz
- updated_at: timestamptz
```

**Note:** `engagement_generated` is currently unused but kept for potential future metrics.

**Indexes:**
- `idx_leaderboard_community_period_points` on (community_id, period_type, points DESC)

---

### Prize & Payout Tables

#### 7. **prize_pools**
Weekly/monthly prize pools funded by community owners.

```sql
- id: uuid (PK)
- community_id: uuid (FK -> communities)
- amount: numeric -- Prize amount in USD
- currency: text (default 'USD')
- period_start: date
- period_end: date
- status: text -- 'pending', 'active', 'completed', 'failed', 'paid_out'
- whop_charge_id: text -- Whop charge ID (from payment creation)
- whop_payment_id: text -- Whop payment ID (after webhook)
- created_at: timestamptz
- updated_at: timestamptz
```

**Status Flow:**
1. `pending` - Payment initiated, awaiting confirmation
2. `active` - Payment succeeded via webhook, pool is live
3. `completed` - Period ended, ready for payouts
4. `paid_out` - Winners have been paid
5. `failed` - Payment failed

---

#### 8. **payouts**
Individual payouts to winners.

```sql
- id: uuid (PK)
- prize_pool_id: uuid (FK -> prize_pools)
- user_id: uuid (FK -> users)
- community_id: uuid (FK -> communities)
- amount: numeric -- Payout amount in USD
- rank: integer -- Winner's rank (1-10)
- status: text -- 'pending', 'processing', 'completed', 'failed'
- whop_payment_id: text -- Whop payout transaction ID
- created_at: timestamptz
- paid_at: timestamptz (nullable)
```

**Distribution:**
- Rank 1: 40% of prize pool
- Rank 2: 30%
- Rank 3: 20%
- Ranks 4-10: 10% split equally (1.43% each)

---

## 🔄 Data Flow

### Engagement Tracking

1. **Sync from Whop** (`/api/sync-whop`)
   - Fetch forum posts via `whopSdk.forumPosts.list()` with view_count, like_count, comment_count
   - Fetch chat messages via `whopSdk.messages.listMessagesFromChat()` with reactions and poll votes
   
2. **Store in posts table**
   - Save with `post_type`, `parent_id`, `view_count`, `likes_count`, `reply_count`, `poll_votes_count`
   
3. **Calculate points**
   - Forum: `(view_count × 0.1) + (reply_count × 1) + (likes_count × 1) + (pinned ? 10 : 0)`
   - Chat: `(reply_count × 0.5) + (likes_count × 0.5) + (poll_votes_count × 0.5) + (pinned ? 10 : 0)`
   - Apply anti-spam filters (min 10 chars, min 1 view)
   
4. **Update leaderboard_entries**
   - Sum all points per user per community
   - Create/update entries for weekly, monthly, all_time

---

### Prize Pool Workflow

1. **Owner creates pool** (Admin Dashboard)
   - POST `/api/payments/create-charge`
   - Creates Whop charge
   - Inserts prize_pools with status='pending'

2. **Payment modal opens** (Whop iframe SDK)
   - User completes payment

3. **Webhook receives event**
   - POST `/api/webhooks/whop`
   - Updates prize_pools to status='active'

4. **Owner processes payouts**
   - POST `/api/payments/payout`
   - Fetches top 10 from leaderboard_entries
   - Calls `whopSdk.payments.payUser()` for each winner
   - Creates payout records
   - Updates prize_pools to status='paid_out'

---

## 📊 Key Queries

### Get User's Points in Community
```sql
SELECT points, rank 
FROM leaderboard_entries
WHERE user_id = $1 
  AND community_id = $2 
  AND period_type = 'all_time';
```

### Get Top 10 Leaderboard
```sql
SELECT u.username, l.points, l.rank
FROM leaderboard_entries l
JOIN users u ON l.user_id = u.id
WHERE l.community_id = $1 
  AND l.period_type = 'weekly'
ORDER BY l.points DESC
LIMIT 10;
```

### Calculate User's Reply Count
```sql
SELECT COUNT(*) as replies_received
FROM posts
WHERE parent_id IN (
  SELECT whop_post_id FROM posts WHERE user_id = $1
)
AND user_id != $1; -- Exclude self-replies
```

---

## 🚮 Removed Tables

These tables existed in earlier versions but are **NO LONGER USED**:

- ❌ **likes** - We don't track likes (Whop API limitation)
- ❌ **comments** - Merged into posts table via `parent_id`
- ❌ **user_points_history** - Points calculated from posts table directly

---

## ✅ Schema is Clean!

The database now perfectly matches the current point system:
- ✅ Views tracked (forum posts only)
- ✅ Replies tracked (forum + chat)
- ✅ No reference to likes
- ✅ Community-specific points
- ✅ Whop payment integration fields
- ✅ All unused tables removed
