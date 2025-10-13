# Custom Level Names Feature - Skool-Style Implementation

## 🎯 Overview

Your Whop leaderboard now supports **custom level names** just like Skool! Each community owner can personalize the 10 level titles to match their community's theme and vibe.

---

## 📊 How It Works (Exactly Like Skool)

### Default Level Names:
- Level 1 (0 points)
- Level 2 (5 points)
- Level 3 (20 points)
- Level 4 (65 points)
- Level 5 (155 points)
- Level 6 (515 points)
- Level 7 (2,015 points)
- Level 8 (8,015 points)
- Level 9 (33,015 points)
- Level 10 (100,000 points)

### Custom Examples (Inspired by Real Skool Communities):
- Level 1 → "Newbie" or "Noob"
- Level 5 → "Active Member"
- Level 10 → "The GOAT" (Greatest of All Time)

### Key Features:
✅ **Per-Community Settings** - Each Whop community has its own custom level names
✅ **10 Customizable Levels** - All 10 levels can be renamed
✅ **Default Fallback** - If not customized, shows "Level 1", "Level 2", etc.
✅ **Instant Updates** - Changes apply immediately across leaderboard and profiles

---

## 🗄️ Database Schema

### communities.level_names Column

```sql
-- JSONB column storing custom level names
ALTER TABLE communities 
ADD COLUMN level_names JSONB DEFAULT '{
  "1": "Level 1",
  "2": "Level 2",
  "3": "Level 3",
  "4": "Level 4",
  "5": "Level 5",
  "6": "Level 6",
  "7": "Level 7",
  "8": "Level 8",
  "9": "Level 9",
  "10": "Level 10"
}'::jsonb;
```

### Database Function

```sql
-- Get level name for a user in a community
SELECT get_level_name(5, 'community-uuid-here');
-- Returns: "Active Member" (if customized) or "Level 5" (default)
```

---

## 🔌 API Endpoints for Whop Integration

### 1. Get Community's Level Names
**Endpoint:** `GET /api/admin/level-names?communityId={whop_community_id}`

**Use Case:** Load current level names when community owner visits admin panel

```javascript
// Fetch current level names
const response = await fetch('/api/admin/level-names?communityId=comm_xyz789');
const data = await response.json();

console.log(data.levelNames);
// Output:
// {
//   "1": "Newbie",
//   "2": "Member",
//   "3": "Regular",
//   ...
//   "10": "The GOAT"
// }
```

**Response:**
```json
{
  "success": true,
  "levelNames": {
    "1": "Level 1",
    "2": "Level 2",
    "3": "Level 3",
    "4": "Level 4",
    "5": "Level 5",
    "6": "Level 6",
    "7": "Level 7",
    "8": "Level 8",
    "9": "Level 9",
    "10": "Level 10"
  }
}
```

---

### 2. Update Community's Level Names
**Endpoint:** `POST /api/admin/level-names`

**Use Case:** Save custom level names when community owner clicks "Save Level Names"

```javascript
// Update level names
await fetch('/api/admin/level-names', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    communityId: 'comm_xyz789',
    levelNames: {
      "1": "Newbie",
      "2": "Apprentice",
      "3": "Regular",
      "4": "Contributor",
      "5": "Active Member",
      "6": "Veteran",
      "7": "Expert",
      "8": "Master",
      "9": "Legend",
      "10": "The GOAT"
    }
  })
});
```

**Request Body:**
```json
{
  "communityId": "comm_xyz789",
  "levelNames": {
    "1": "Newbie",
    "2": "Apprentice",
    "3": "Regular",
    "4": "Contributor",
    "5": "Active Member",
    "6": "Veteran",
    "7": "Expert",
    "8": "Master",
    "9": "Legend",
    "10": "The GOAT"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Level names updated successfully",
  "levelNames": {
    "1": "Newbie",
    ...
  }
}
```

---

## 🎨 Admin UI Implementation

### Location:
Admin Dashboard → "Customize Level Names" Card

### Features:
- **10 Input Fields** - One for each level
- **Point Thresholds Shown** - Display required points next to each level
- **Placeholder Examples** - Suggest creative names (e.g., "The GOAT" for Level 10)
- **Save Button** - Updates all level names at once
- **Whop Brand Styling** - Uses #FA4616 orange accent

### UI Flow:
1. Community owner visits `/admin`
2. Scrolls to "Customize Level Names" section
3. Edits level names in input fields
4. Clicks "Save Level Names"
5. API updates `communities.level_names` in Supabase
6. Changes apply instantly across app

---

## 🔄 Integration with Whop SDK

### Step 1: Load Level Names on Admin Page Load

```javascript
// In your Whop app admin panel
useEffect(() => {
  async function loadLevelNames() {
    const whopCommunityId = getCurrentWhopCommunity();
    const response = await fetch(`/api/admin/level-names?communityId=${whopCommunityId}`);
    const data = await response.json();
    setLevelNames(data.levelNames);
  }
  
  loadLevelNames();
}, []);
```

### Step 2: Save Level Names

```javascript
// When admin clicks "Save"
async function handleSaveLevelNames() {
  const whopCommunityId = getCurrentWhopCommunity();
  
  await fetch('/api/admin/level-names', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      communityId: whopCommunityId,
      levelNames: {
        "1": levelName1Input.value,
        "2": levelName2Input.value,
        // ... all 10 levels
        "10": levelName10Input.value
      }
    })
  });
  
  alert('Level names saved!');
}
```

### Step 3: Display Custom Level Names

```javascript
// When showing user's level on leaderboard or profile
async function getUserLevel(userId, communityId) {
  // Get user's current level (1-10)
  const userLevel = await calculateUserLevel(userId);
  
  // Get custom level name from community settings
  const response = await fetch(`/api/admin/level-names?communityId=${communityId}`);
  const data = await response.json();
  
  const levelName = data.levelNames[userLevel.toString()];
  
  return {
    level: userLevel,
    name: levelName // "The GOAT" instead of "Level 10"
  };
}
```

---

## 📝 Example Use Cases

### Example 1: Fitness Community
```json
{
  "1": "Beginner",
  "2": "Rookie",
  "3": "Athlete",
  "4": "Dedicated",
  "5": "Beast Mode",
  "6": "Champion",
  "7": "Elite",
  "8": "Pro",
  "9": "Legend",
  "10": "Fitness Icon"
}
```

### Example 2: Crypto Community
```json
{
  "1": "Paper Hands",
  "2": "Hodler",
  "3": "Trader",
  "4": "Whale Watcher",
  "5": "Degen",
  "6": "Diamond Hands",
  "7": "Crypto Native",
  "8": "Whale",
  "9": "Moonboy",
  "10": "Satoshi Disciple"
}
```

### Example 3: Business/Startup Community
```json
{
  "1": "Dreamer",
  "2": "Hustler",
  "3": "Builder",
  "4": "Founder",
  "5": "CEO",
  "6": "Innovator",
  "7": "Unicorn",
  "8": "Empire Builder",
  "9": "Titan",
  "10": "The Mogul"
}
```

---

## 🧪 Testing

### Test Custom Level Names

```bash
# 1. Get default level names
curl "https://your-app.com/api/admin/level-names?communityId=test_comm_1"

# 2. Update with custom names
curl -X POST https://your-app.com/api/admin/level-names \
  -H "Content-Type: application/json" \
  -d '{
    "communityId": "test_comm_1",
    "levelNames": {
      "1": "Newbie",
      "2": "Member",
      "3": "Regular",
      "4": "Contributor",
      "5": "Active",
      "6": "Veteran",
      "7": "Expert",
      "8": "Master",
      "9": "Legend",
      "10": "The GOAT"
    }
  }'

# 3. Verify changes
curl "https://your-app.com/api/admin/level-names?communityId=test_comm_1"
```

---

## 🎯 Implementation Checklist for Whop Integration

- [ ] Add "Community ID" context to your Whop app (to identify which community is being managed)
- [ ] Load level names when admin visits settings: `GET /api/admin/level-names`
- [ ] Create input fields for all 10 level names
- [ ] Save level names when admin clicks save: `POST /api/admin/level-names`
- [ ] Update leaderboard display to show custom level names
- [ ] Update user profile display to show custom level names
- [ ] Add validation (max 20 characters per level name recommended)
- [ ] Test with multiple communities (each should have separate level names)

---

## 💡 Best Practices

### Do's:
✅ Keep level names short (under 20 characters)
✅ Make them relevant to your community theme
✅ Use creative, engaging names for higher levels
✅ Test how they look on mobile
✅ Save changes frequently

### Don'ts:
❌ Don't use offensive or inappropriate names
❌ Don't make them too long (truncation issues)
❌ Don't change them too frequently (confuses members)
❌ Don't use special characters that might break display

---

## 🚀 Ready for Whop Integration

Your database and API are now ready! Just connect your Whop SDK to:
1. Load current level names: `GET /api/admin/level-names`
2. Save new level names: `POST /api/admin/level-names`
3. Display custom names on leaderboard and profiles

The feature is fully implemented and waiting for your Whop app integration! 🎉
