# 🔬 WHOP API TESTING PLAN - SYSTEMATIC VERIFICATION

**Date:** January 2025  
**Purpose:** Test each Whop API endpoint to understand EXACTLY how to identify communities and track engagement

---

## 🎯 CRITICAL QUESTIONS TO ANSWER

1. **How do we get companyId from our experienceId?**
2. **How do we identify which community our app is installed in?**
3. **How do we list all experiences (forums, chats) in that community?**
4. **How do we fetch engagement data from those experiences?**
5. **How do users map across the community?**

---

## 📋 KNOWN INFORMATION

- **Our App's Experience ID:** `exp_4jHgqrvf1Evc0U`
- **Whop Credentials:** Set in `.env`
  - WHOP_API_KEY
  - NEXT_PUBLIC_WHOP_APP_ID
  - NEXT_PUBLIC_WHOP_AGENT_USER_ID
  - NEXT_PUBLIC_WHOP_COMPANY_ID (but this might be YOUR company, not the user's)

---

## 🔍 TEST SEQUENCE

### **TEST #1: Get Experience Details**
**Endpoint:** `whopSdk.experiences.getExperience()`  
**Documentation:** https://docs.whop.com/sdk/api/experiences/get-experience

**Purpose:** When a user accesses our app at `/experiences/exp_4jHgqrvf1Evc0U`, what info do we get?

**Test Code:**
```javascript
const experience = await whopSdk.experiences.getExperience({
  experienceId: 'exp_4jHgqrvf1Evc0U'
});
console.log('Experience Data:', JSON.stringify(experience, null, 2));
```

**Expected Data:**
- Does it return `company.id`? (the community's companyId)
- Does it return `company.name`?
- What other fields exist?

**File to test:** `/app/api/test-whop/route.js` (already exists)

---

### **TEST #2: Get Company Details**
**Endpoint:** `whopSdk.companies.getCompany()`  
**Documentation:** https://docs.whop.com/sdk/api/companies/get-company

**Purpose:** Once we have companyId, what info can we get about the community?

**Test Code:**
```javascript
// Assuming we got companyId from Test #1
const company = await whopSdk.companies.getCompany({
  companyId: '[companyId from test 1]'
});
console.log('Company Data:', JSON.stringify(company, null, 2));
```

**Expected Data:**
- Company name/title
- Owner info
- Any settings or metadata

---

### **TEST #3: List All Experiences in Community**
**Endpoint:** `whopSdk.experiences.listExperiences()`  
**Documentation:** https://docs.whop.com/sdk/api/experiences/list-experiences

**Purpose:** Get ALL experiences (our app, forums, chats, etc.) in the community

**Test Code:**
```javascript
const experiences = await whopSdk.experiences.listExperiences({
  companyId: '[companyId from test 1]',
  first: 50  // Get up to 50 experiences
});
console.log('All Experiences:', JSON.stringify(experiences, null, 2));
```

**Questions:**
- How do we identify forum experiences vs chat experiences?
- Do they have a `type` field?
- How do we filter to only track forums/chats (not our own app)?

---

### **TEST #4: Get Access Passes for Experience**
**Endpoint:** `whopSdk.experiences.listAccessPassesForExperience()`  
**Documentation:** https://docs.whop.com/sdk/api/experiences/list-access-passes-for-experience

**Purpose:** Understand access control - who can access what?

**Test Code:**
```javascript
const accessPasses = await whopSdk.experiences.listAccessPassesForExperience({
  experienceId: 'exp_4jHgqrvf1Evc0U'
});
console.log('Access Passes:', JSON.stringify(accessPasses, null, 2));
```

**Questions:**
- What does this tell us?
- Do we need this for user authentication?

---

### **TEST #5: List Forum Posts**
**Endpoint:** `whopSdk.forums.listForumPostsFromForum()`  
**Documentation:** https://docs.whop.com/sdk/api/forums/list-forum-posts-from-forum

**Purpose:** Fetch actual engagement data from a forum

**Test Code:**
```javascript
// Assuming we found a forum experienceId from Test #3
const forumPosts = await whopSdk.forums.listForumPostsFromForum({
  forumId: '[forum experienceId from test 3]',
  first: 20
});
console.log('Forum Posts:', JSON.stringify(forumPosts, null, 2));
```

**Questions:**
- What user data is included? (userId, username, avatar?)
- What engagement metrics? (views, replies, likes?)
- How do we calculate points from this data?

---

### **TEST #6: User Authentication**
**Endpoint:** `whopSdk.verifyUserToken()`  
**Documentation:** Implemented in `/lib/authentication.js`

**Purpose:** Verify the current user accessing the app

**Test Code:**
```javascript
const headersList = await headers();
const { userId } = await whopSdk.verifyUserToken(headersList);
console.log('Current User ID:', userId);
```

**Questions:**
- What userId format do we get?
- How does this map to forum post authors?
- Do we get username/avatar from this?

---

## 🚀 PROPOSED TESTING ENDPOINT

Create: `/app/api/test-whop-flow/route.js`

This will run ALL tests in sequence and log results:

```javascript
import { NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET(request) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // TEST #1: Get Our App's Experience
    console.log('\n========== TEST #1: Get Experience ==========');
    const experience = await whopSdk.experiences.getExperience({
      experienceId: 'exp_4jHgqrvf1Evc0U'
    });
    results.tests.push({
      test: 'Get Experience',
      success: true,
      data: experience
    });
    
    const companyId = experience?.company?.id;
    console.log('Extracted companyId:', companyId);

    if (!companyId) {
      throw new Error('No companyId found in experience');
    }

    // TEST #2: Get Company Details
    console.log('\n========== TEST #2: Get Company ==========');
    const company = await whopSdk.companies.getCompany({
      companyId: companyId
    });
    results.tests.push({
      test: 'Get Company',
      success: true,
      data: company
    });

    // TEST #3: List All Experiences in Community
    console.log('\n========== TEST #3: List Experiences ==========');
    const allExperiences = await whopSdk.experiences.listExperiences({
      companyId: companyId,
      first: 50
    });
    results.tests.push({
      test: 'List Experiences',
      success: true,
      data: allExperiences
    });

    // Identify forum and chat experiences
    const forumExperiences = allExperiences.nodes.filter(exp => 
      exp.type === 'forum' || exp.name?.toLowerCase().includes('forum')
    );
    const chatExperiences = allExperiences.nodes.filter(exp => 
      exp.type === 'chat' || exp.name?.toLowerCase().includes('chat')
    );

    console.log('Forum Experiences:', forumExperiences.length);
    console.log('Chat Experiences:', chatExperiences.length);

    results.analysis = {
      companyId: companyId,
      companyTitle: company.title,
      totalExperiences: allExperiences.nodes.length,
      forumCount: forumExperiences.length,
      chatCount: chatExperiences.length,
      forumExperienceIds: forumExperiences.map(e => e.id),
      chatExperienceIds: chatExperiences.map(e => e.id)
    };

    // TEST #4: If we have a forum, get posts
    if (forumExperiences.length > 0) {
      console.log('\n========== TEST #4: Get Forum Posts ==========');
      const firstForum = forumExperiences[0];
      try {
        const forumPosts = await whopSdk.forums.listForumPostsFromForum({
          forumId: firstForum.id,
          first: 10
        });
        results.tests.push({
          test: 'Get Forum Posts',
          success: true,
          forumId: firstForum.id,
          data: forumPosts
        });
      } catch (error) {
        results.tests.push({
          test: 'Get Forum Posts',
          success: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All tests completed',
      results: results
    });

  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      results: results
    }, { status: 500 });
  }
}
```

---

## 📝 TESTING PROCEDURE

### **Step 1: Create Test Endpoint**
- Create `/app/api/test-whop-flow/route.js` with code above

### **Step 2: Deploy to Vercel**
- Commit and push changes
- Let Vercel deploy

### **Step 3: Run Test from Whop**
- Open your app in Whop community
- Access: `https://[your-app].vercel.app/api/test-whop-flow`
- Check console logs in Vercel dashboard

### **Step 4: Analyze Results**
Answer these questions:
1. ✅ Can we extract companyId from experienceId?
2. ✅ Can we list all experiences in the community?
3. ✅ Can we identify forum vs chat experiences?
4. ✅ Can we fetch forum posts with user data?
5. ✅ What user data is available in posts?

### **Step 5: Document Findings**
Based on test results, create implementation plan

---

## 🎯 EXPECTED FLOW (To Be Verified)

```
1. User opens app → /experiences/exp_4jHgqrvf1Evc0U
2. Server extracts experienceId from URL
3. Call whopSdk.experiences.getExperience(experienceId)
4. Extract companyId from experience.company.id
5. Store companyId in our database (communities table)
6. Call whopSdk.experiences.listExperiences(companyId)
7. Filter experiences to find forums and chats
8. For each forum/chat:
   - Fetch posts/messages
   - Calculate points per user
   - Store in leaderboard_entries table
9. Display leaderboard filtered by companyId
```

**BUT WE NEED TO TEST TO CONFIRM THIS WORKS!**

---

## ✅ SUCCESS CRITERIA

After testing, we should know:
- ✅ Exact API calls needed
- ✅ Data structure returned by each endpoint
- ✅ How to map users across experiences
- ✅ How to calculate points from raw data
- ✅ How to handle multiple communities
- ✅ Any limitations or edge cases

---

## 🚨 NEXT STEP

**Before ANY code refactoring, let's:**
1. Create the test endpoint
2. Deploy and run it
3. Analyze actual API responses
4. Document exact implementation flow
5. THEN refactor routes surgically

**No assumptions. Only verified facts.** 🔬
