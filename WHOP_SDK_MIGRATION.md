# Whop SDK Migration Guide

**Migration Date:** January 2025  
**From:** `@whop/api` v0.0.42 (deprecated)  
**To:** `@whop/sdk` (latest)

---

## Key API Changes

### 1. Access Check
**OLD API:**
```js
const { accessLevel } = await whopSdk.access.checkIfUserHasAccessToExperience({
  userId,
  experienceId,
});
```

**NEW API:**
```js
const { access_level: accessLevel } = await whopSdk.users.checkAccess(experienceId, { 
  id: userId 
});
```

### 2. Forum Posts Listing
**OLD API:**
```js
const response = await whopSdk.forums.listForumPostsFromForum({
  forumExperienceId: forumId
});
```

**NEW API:**
```js
const response = await whopSdk.forumPosts.list({
  forum_id: forumId,
  limit: 100
});
```

**Response Fields (snake_case):**
- `view_count`
- `like_count`
- `comment_count`
- `is_pinned`
- `parent_id`
- `created_at`
- `updated_at`

### 3. Chat Messages Listing
**NEW API includes engagement metrics:**
```js
const response = await whopSdk.messages.listMessagesFromChat({
  chatExperienceId: chatId,
  includeReplies: true
});
```

**Response Fields:**
- `view_count`
- `reaction_counts[]` - Array with `{ emoji, count }`
- `poll_votes[]` - Array with `{ option_id, count }`
- `replying_to_message_id`
- `is_pinned`

---

## Files Updated

1. **`/app/lib/whop-sdk.js`**
   - Changed import from `@whop/api` to `@whop/sdk`

2. **`/app/lib/authentication.js`**
   - Updated access check method signature

3. **`/app/lib/whop-sync.js`**
   - Updated forum posts sync to use `forumPosts.list()`
   - Updated to extract snake_case fields from API
   - Added support for likes, reactions, poll votes

4. **`/app/lib/points-system.js`**
   - Refactored to accept direct API values
   - Added likes and poll votes to point calculations

---

## Testing Checklist

- [ ] User authentication works in Whop iframe
- [ ] Forum posts sync correctly with engagement metrics
- [ ] Chat messages sync with reactions and poll votes
- [ ] Points calculate correctly with new formula
- [ ] Leaderboard displays updated points
- [ ] UI shows correct point breakdown info

---

## New Point System

**Forum Posts:**
```
(view_count × 0.1) + (comment_count × 1) + (like_count × 1) + (is_pinned ? 10 : 0)
```

**Chat Messages:**
```
(reply_count × 0.5) + (reaction_count × 0.5) + (poll_votes_count × 0.5) + (is_pinned ? 10 : 0)
```
