# 🎯 WHOP APP ARCHITECTURE - COMPLETE ANALYSIS

**Date:** January 2025  
**Purpose:** Understand EXACTLY how Whop apps work and what we need to implement

---

## 📚 OFFICIAL WHOP DOCUMENTATION FINDINGS

### 1. **Whop App Routing Structure** (from official template)

```
/app
├── layout.tsx                           # Root layout with WhopIframeSdkProvider
├── page.tsx                            # Setup instructions page (NOT the main app)
├── globals.css                         # Styles
├── api/
│   └── webhooks/                       # Webhook endpoints
├── experiences/[experienceId]/
│   └── page.tsx                        # MAIN APP - User view
├── dashboard/[companyId]/
│   └── page.tsx                        # Admin/Owner dashboard
└── discover/
    └── page.tsx                        # Discovery/marketplace view
```

### 2. **Whop Dashboard Configuration**

In Whop Developer Dashboard → Hosting section:
- **Base URL:** Your deployed domain (e.g., `https://yourapp.vercel.app`)
- **App path:** `/experiences/[experienceId]` ⭐ **PRIMARY ROUTE**
- **Dashboard path:** `/dashboard/[companyId]` ⭐ **ADMIN ROUTE**
- **Discover path:** `/discover` (optional marketplace view)

---

## 🎯 WHAT THIS MEANS FOR OUR APP

### ✅ CORRECT Architecture (Official Pattern)

**1. Root Page (`/app/page.tsx`)**
- **Purpose:** Setup instructions, onboarding
- **NOT the main app UI**
- **Users NEVER see this in production**
- Only visible during local development setup

**2. Experience Route (`/app/experiences/[experienceId]/page.tsx`)**
- **Purpose:** THE MAIN APP UI
- **This is where users access the leaderboard**
- Whop routes users here automatically
- Has access to:
  - `experienceId` from URL params
  - User authentication via Whop SDK
  - Company/community context

**3. Dashboard Route (`/app/dashboard/[companyId]/page.tsx`)**
- **Purpose:** Admin/owner controls
- For community owners to:
  - Create prize pools
  - Process payouts
  - View analytics
  - Customize level names

---

## 🏗️ OUR APP'S DESIRED FUNCTIONALITY

### **Core Goal:**
A community engagement leaderboard that rewards active members with points and prizes, inspired by Skool's leaderboard system.

### **Primary Features:**

#### 1. **Main Leaderboard View** (`/experiences/[experienceId]`)
- Display top 10 users ranked by points
- Show current user's rank and stats
- Display active prize pool info
- Level progression system (10 levels, Skool-style)
- Points calculation:
  - Forum posts: 0.1 points per view, 1 point per reply
  - Chat messages: 0.5 points per reply
  - Pinned posts: 10 point bonus

#### 2. **User Stats Page** (`/experiences/[experienceId]/stats`)
- Total earnings from prize pools
- Current level & progress
- Daily streaks
- Rank history
- Activity breakdown

#### 3. **Admin Dashboard** (`/dashboard/[companyId]`)
- Create/manage prize pools (funded via Whop Payments)
- Process payouts to winners
- Community analytics
- Customize level names per community

---

## 📊 DATA ARCHITECTURE

### **How Data Flows:**

```
User opens app in Whop
    ↓
Whop routes to: /experiences/[experienceId]
    ↓
Next.js extracts: experienceId from URL
    ↓
Server-side auth: verifyUser(experienceId)
    ↓
Get company context: getCompanyContext(experienceId)
    ↓
Returns: { userId, companyId, companyTitle, ... }
    ↓
Pass to client component with user & company data
    ↓
Client fetches: /api/leaderboard?companyId=xxx&period=all_time
    ↓
Display leaderboard for THAT specific community
```

### **Key Context:**
- **experienceId** = The app installation in a specific community
- **companyId** = The Whop community/company ID
- **userId** = The authenticated Whop user

---

## 🔧 EXACT IMPLEMENTATION REQUIREMENTS

### **File Structure (What We Should Have):**

```
/app
├── layout.js                              ✅ WhopIframeSdkProvider wrapper
├── page.js                                ⚠️ Should be setup instructions only
├── globals.css                            ✅ Styles
├── api/
│   └── [[...path]]/route.js              ✅ API routes (leaderboard, user-stats, admin)
├── experiences/[experienceId]/
│   ├── layout.js                         ✅ WhopWebsocketProvider (optional)
│   ├── page.js                           ✅ Server component (auth + pass context)
│   ├── leaderboard.client.js             ✅ Main leaderboard UI
│   ├── stats/
│   │   └── page.js                       ❓ Should exist for user stats
│   └── admin/
│       └── page.js                       ❓ Should this be here or at root?
├── dashboard/[companyId]/
│   └── page.js                           ❓ OR should admin be here?
├── admin/
│   └── page.js                           ⚠️ Currently exists at root (wrong?)
└── stats/
    └── page.js                           ⚠️ Currently exists at root (wrong?)
```

---

## ❌ CURRENT ISSUES IN OUR CODE

### **Issue #1: Confusing Route Structure**
- ✅ We have `/app/experiences/[experienceId]/` (CORRECT)
- ❌ We also have `/app/admin/` and `/app/stats/` at root level (WRONG)
- ❓ Should admin/stats be INSIDE the experience route?

### **Issue #2: Root Page Confusion**
- Currently `/app/page.js` was the main leaderboard (WRONG)
- I changed it to landing page (CORRECT per official template)
- But now you're saying it created confusion

### **Issue #3: Navigation Links**
In `leaderboard.client.js` we have:
```js
<Link href="/stats">My Stats</Link>
<Link href="/admin">Admin</Link>
```

These links go to ROOT-level routes, not experience-scoped routes!

**Should be:**
```js
<Link href={`/experiences/${experienceId}/stats`}>My Stats</Link>
<Link href={`/dashboard/${companyId}`}>Admin</Link>
```

---

## 🎯 THE CORRECT ARCHITECTURE (What We Need)

### **Option A: Everything Under Experience Route**
```
/app
├── layout.js                              # Root provider
├── page.js                                # Setup instructions
├── api/[[...path]]/route.js              # API endpoints
└── experiences/[experienceId]/
    ├── page.js                            # Main leaderboard (server)
    ├── leaderboard.client.js              # Leaderboard UI (client)
    ├── stats/
    │   └── page.js                        # User stats page
    └── admin/
        └── page.js                        # Admin dashboard
```

**Navigation:**
- Leaderboard: `/experiences/[experienceId]`
- Stats: `/experiences/[experienceId]/stats`
- Admin: `/experiences/[experienceId]/admin`

### **Option B: Separate Dashboard Route (Official Pattern)**
```
/app
├── layout.js                              # Root provider
├── page.js                                # Setup instructions
├── api/[[...path]]/route.js              # API endpoints
├── experiences/[experienceId]/
│   ├── page.js                            # Main leaderboard (server)
│   ├── leaderboard.client.js              # Leaderboard UI (client)
│   └── stats/
│       └── page.js                        # User stats page
└── dashboard/[companyId]/
    └── page.js                            # Admin dashboard (owner only)
```

**Navigation:**
- Leaderboard: `/experiences/[experienceId]`
- Stats: `/experiences/[experienceId]/stats`
- Admin: `/dashboard/[companyId]`

---

## ✅ RECOMMENDED SOLUTION

### **Use Option B (Matches Official Template)**

**Why:**
1. Separates user features from admin features
2. Admin dashboard uses `companyId` (not tied to specific experience)
3. Matches Whop's official template pattern
4. Owner can manage ALL communities from one dashboard

**Changes Needed:**
1. ✅ Keep `/app/page.js` as setup instructions (already done)
2. ❌ DELETE `/app/admin/page.js` (wrong location)
3. ❌ DELETE `/app/stats/page.js` (wrong location)
4. ✅ MOVE stats to `/app/experiences/[experienceId]/stats/page.js`
5. ✅ MOVE admin to `/app/dashboard/[companyId]/page.js`
6. ✅ UPDATE all navigation links to use correct paths
7. ✅ UPDATE API calls to pass `companyId` correctly

---

## 🚀 IMPLEMENTATION CHECKLIST

### Phase 1: Clean Up Routes
- [ ] Delete `/app/admin/page.js`
- [ ] Delete `/app/stats/page.js`
- [ ] Create `/app/experiences/[experienceId]/stats/page.js`
- [ ] Create `/app/dashboard/[companyId]/page.js`

### Phase 2: Fix Navigation
- [ ] Update leaderboard links to point to `/experiences/[experienceId]/stats`
- [ ] Update admin link to point to `/dashboard/[companyId]`
- [ ] Ensure `experienceId` and `companyId` are passed through components

### Phase 3: Fix API Integration
- [ ] Ensure stats page extracts user from Whop SDK
- [ ] Ensure admin page extracts companyId from URL params
- [ ] Update all API calls to include proper context

### Phase 4: Test
- [ ] Deploy to Vercel
- [ ] Test in Whop iframe
- [ ] Verify authentication works
- [ ] Verify data loads correctly

---

## 📖 FINAL UNDERSTANDING

### **How Whop Apps Work:**
1. User installs your app in their Whop community
2. App gets an `experienceId` for that installation
3. When user opens the app, Whop loads: `/experiences/[experienceId]`
4. Your server extracts user auth & company context
5. Your client displays community-specific data
6. Admin features use `/dashboard/[companyId]` for owner controls

### **What Makes Our App Work:**
- ✅ Proper authentication via Whop SDK
- ✅ Extracting `companyId` from experience context
- ✅ Passing `companyId` to ALL API calls
- ✅ Community-scoped data (points, leaderboards per community)
- ✅ Correct route structure matching Whop patterns

---

## 🎯 NEXT ACTIONS

1. **CONFIRM:** Is this understanding correct?
2. **DECIDE:** Should we use Option A or Option B for routing?
3. **EXECUTE:** Surgical cleanup of route structure
4. **TEST:** Deploy and verify in Whop iframe

**This is the foundation. Let's get this right before ANY code changes.**
