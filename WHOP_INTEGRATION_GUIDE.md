# Whop SDK Integration Guide for Engagement Leaderboard

## 🎯 Skool Point System Implementation

Your leaderboard now uses **Skool's exact point system**:

### Core Rule:
**1 LIKE = 1 POINT** (awarded to the content creator)

### Level Thresholds:
- Level 1: 0 points
- Level 2: 5 points
- Level 3: 20 points
- Level 4: 65 points
- Level 5: 155 points
- Level 6: 515 points
- Level 7: 2,015 points
- Level 8: 8,015 points
- Level 9: 33,015 points
- Level 10: 100,000 points

---

## 📊 Database Architecture

The point system is **fully automated** with database triggers:

1. When a like is added → points automatically calculated and user level updated
2. When a like is removed → points automatically deducted and level recalculated
3. All point transactions logged in `user_points_history` table

---

## 🔌 API Endpoints for Whop Integration

### 1. Sync User Data from Whop
**Endpoint:** `POST /api/sync/user`

```javascript
// Create or update a user when they join your Whop community
fetch('/api/sync/user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    whop_user_id: 'user_abc123',      // Whop user ID
    username: 'John Doe',              // Display name
    avatar_url: 'https://...',         // Profile picture
    whop_community_id: 'comm_xyz789'   // Your Whop community ID
  })
});
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "whop_user_id": "user_abc123",
    "username": "John Doe",
    "total_points": 0,
    "current_level": 1
  }
}
```

---

### 2. Track Post Creation
**Endpoint:** `POST /api/sync/post`

```javascript
// When a user creates a post in Whop
fetch('/api/sync/post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    whop_post_id: 'post_123',          // Whop's post ID
    whop_user_id: 'user_abc123',       // Author's Whop user ID
    whop_community_id: 'comm_xyz789',  // Community ID
    content: 'Post text content...',   // Post text
    created_at: '2025-01-20T10:30:00Z' // Timestamp
  })
});
```

**Note:** Creating a post does NOT award points. Only likes award points.

---

### 3. Track Comment Creation
**Endpoint:** `POST /api/sync/comment`

```javascript
// When a user comments on a post in Whop
fetch('/api/sync/comment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    whop_comment_id: 'comment_456',    // Whop's comment ID
    whop_post_id: 'post_123',          // Parent post ID
    whop_user_id: 'user_abc123',       // Commenter's Whop user ID
    whop_community_id: 'comm_xyz789',  // Community ID
    content: 'Great post!',            // Comment text
    created_at: '2025-01-20T10:35:00Z' // Timestamp
  })
});
```

**Note:** Creating a comment does NOT award points. Only likes award points.

---

### 4. Track Like (This Awards Points!)
**Endpoint:** `POST /api/sync/like`

```javascript
// When a user likes a post or comment in Whop
fetch('/api/sync/like', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    whop_user_id: 'user_def456',       // Who gave the like
    whop_community_id: 'comm_xyz789',  // Community ID
    target_type: 'post',               // 'post' or 'comment'
    whop_target_id: 'post_123',        // Whop's post or comment ID
    created_at: '2025-01-20T10:40:00Z' // Timestamp
  })
});
```

**Response:**
```json
{
  "success": true,
  "point_awarded": {
    "content_author_id": "uuid-here",
    "points_earned": 1,
    "new_total_points": 127,
    "new_level": 5,
    "level_up": false
  }
}
```

**🎉 This automatically:**
- Awards 1 point to the content creator
- Updates their total points
- Recalculates their level
- Logs the transaction in `user_points_history`

---

### 5. Remove Like (Remove Point)
**Endpoint:** `DELETE /api/sync/like`

```javascript
// When a user unlikes a post or comment in Whop
fetch('/api/sync/like', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    whop_user_id: 'user_def456',       // Who removed the like
    whop_community_id: 'comm_xyz789',  // Community ID
    target_type: 'post',               // 'post' or 'comment'
    whop_target_id: 'post_123'         // Whop's post or comment ID
  })
});
```

**🎉 This automatically:**
- Removes 1 point from the content creator
- Updates their total points
- Recalculates their level
- Logs the transaction

---

### 6. Get User Stats
**Endpoint:** `GET /api/user-stats?whop_user_id=user_abc123&community_id=comm_xyz789`

```javascript
// Get a user's current stats
const response = await fetch('/api/user-stats?whop_user_id=user_abc123&community_id=comm_xyz789');
const data = await response.json();
```

**Response:**
```json
{
  "success": true,
  "user": {
    "whop_user_id": "user_abc123",
    "username": "John Doe",
    "avatar_url": "https://...",
    "total_points": 127,
    "current_level": 5,
    "rank": 12,
    "next_level_info": {
      "current_level": 5,
      "next_level": 6,
      "points_needed": 388,
      "progress_percent": 45
    }
  }
}
```

---

### 7. Get Community Leaderboard
**Endpoint:** `GET /api/leaderboard?community_id=comm_xyz789&period=weekly&limit=50`

**Parameters:**
- `community_id` (required): Your Whop community ID
- `period` (optional): `weekly`, `monthly`, `all_time` (default: `weekly`)
- `limit` (optional): Number of users to return (default: 50, max: 100)

```javascript
const response = await fetch('/api/leaderboard?community_id=comm_xyz789&period=weekly');
const data = await response.json();
```

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "whop_user_id": "user_xyz",
      "username": "Sarah Chen",
      "avatar_url": "https://...",
      "total_points": 2847,
      "current_level": 7,
      "likes_received": 2847
    },
    {
      "rank": 2,
      "whop_user_id": "user_abc",
      "username": "Alex Rivera",
      "total_points": 2156,
      "current_level": 7,
      "likes_received": 2156
    }
  ],
  "total_members": 847,
  "period": "weekly"
}
```

---

## 🔄 Whop Webhook Integration

Set up webhooks in your Whop dashboard to automatically sync activity:

### Webhook Events to Listen For:

1. **`post.created`** → Call `POST /api/sync/post`
2. **`comment.created`** → Call `POST /api/sync/comment`
3. **`like.created`** → Call `POST /api/sync/like` ⭐ (Awards points!)
4. **`like.deleted`** → Call `DELETE /api/sync/like` ⭐ (Removes points!)
5. **`member.joined`** → Call `POST /api/sync/user`

### Webhook Handler Example:

```javascript
// In your Whop webhook endpoint
app.post('/webhooks/whop', async (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'like.created':
      await fetch('https://your-app.com/api/sync/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whop_user_id: event.data.user_id,
          whop_community_id: event.data.community_id,
          target_type: event.data.target_type,
          whop_target_id: event.data.target_id,
          created_at: event.created_at
        })
      });
      break;
      
    case 'like.deleted':
      await fetch('https://your-app.com/api/sync/like', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whop_user_id: event.data.user_id,
          whop_community_id: event.data.community_id,
          target_type: event.data.target_type,
          whop_target_id: event.data.target_id
        })
      });
      break;
      
    // Handle other events...
  }
  
  res.json({ success: true });
});
```

---

## 🎮 Testing the Point System

### Test Scenario 1: New User Journey

```bash
# 1. Create user
curl -X POST https://your-app.com/api/sync/user \
  -H "Content-Type: application/json" \
  -d '{
    "whop_user_id": "test_user_1",
    "username": "Test User",
    "whop_community_id": "test_comm_1"
  }'

# 2. User creates a post (no points yet)
curl -X POST https://your-app.com/api/sync/post \
  -H "Content-Type: application/json" \
  -d '{
    "whop_post_id": "test_post_1",
    "whop_user_id": "test_user_1",
    "whop_community_id": "test_comm_1",
    "content": "My first post!"
  }'

# 3. Someone likes the post (awards 1 point!)
curl -X POST https://your-app.com/api/sync/like \
  -H "Content-Type: application/json" \
  -d '{
    "whop_user_id": "other_user",
    "whop_community_id": "test_comm_1",
    "target_type": "post",
    "whop_target_id": "test_post_1"
  }'

# 4. Check user's stats (should have 1 point, Level 1)
curl "https://your-app.com/api/user-stats?whop_user_id=test_user_1&community_id=test_comm_1"
```

### Test Scenario 2: Level Up

```bash
# Add 5 likes to reach Level 2
for i in {1..5}; do
  curl -X POST https://your-app.com/api/sync/like \
    -H "Content-Type: application/json" \
    -d "{
      \"whop_user_id\": \"liker_$i\",
      \"whop_community_id\": \"test_comm_1\",
      \"target_type\": \"post\",
      \"whop_target_id\": \"test_post_1\"
    }"
done

# Check level (should be Level 2 now)
curl "https://your-app.com/api/user-stats?whop_user_id=test_user_1&community_id=test_comm_1"
```

---

## 📋 Database Tables Reference

### Main Tables:
- **`users`**: User profiles with cached `total_points` and `current_level`
- **`communities`**: Your Whop communities
- **`posts`**: Synced posts from Whop
- **`comments`**: Synced comments from Whop
- **`likes`**: Synced likes (triggers point calculation)
- **`user_points_history`**: Audit log of all point transactions

### Helper Functions (Already Created):
- `calculate_user_points(user_id, community_id)` - Count likes received
- `calculate_level_from_points(points)` - Convert points to level
- `update_user_points_and_level(user_id, community_id)` - Recalculate everything

### Triggers (Already Active):
- When like added → award point automatically
- When like removed → deduct point automatically

---

## 🚀 Quick Start Checklist

- [ ] Set up Whop webhooks pointing to your endpoints
- [ ] Test with a few manual API calls
- [ ] Verify points are being awarded correctly
- [ ] Check leaderboard is updating in real-time
- [ ] Connect your Whop community frontend to display the leaderboard

---

## 💡 Important Notes

1. **Only likes award points** - Just like Skool, posts and comments don't directly give points
2. **Points are per-community** - Users have separate points/levels in each community
3. **Automatic calculation** - Database triggers handle everything, no manual updates needed
4. **Audit trail** - Every point transaction is logged in `user_points_history`
5. **Real-time updates** - Leaderboard updates instantly when likes are added/removed

---

## 🆘 Troubleshooting

**Points not updating?**
- Check if the like was properly recorded in the `likes` table
- Verify the trigger is active: `SELECT * FROM pg_trigger WHERE tgname LIKE 'trigger_like%';`

**User level stuck?**
- Manually recalculate: `SELECT update_user_points_and_level('user_uuid', 'community_uuid');`

**Need to bulk import existing data?**
- Insert all historical posts, comments, and likes
- Run: `SELECT update_user_points_and_level(user_id, community_id) FROM community_members;`

---

**Questions?** Check the database functions or API response messages for detailed info!