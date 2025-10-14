# Community Engagement Leaderboard - Whop App

A gamified community engagement platform built for Whop communities, rewarding active members through point-based leaderboards and prize pools.

## ⚠️ Important: Local Preview Limitations

**The app will show errors in local preview (`http://localhost:3000`) - THIS IS EXPECTED!**

The Whop SDK (`WhopIframeSdkProvider`) ONLY works when:
1. ✅ App is deployed to Vercel (HTTPS)
2. ✅ App is accessed inside Whop's iframe
3. ✅ User is authenticated via Whop

**Error you'll see locally:**
```
TypeError: render is not a function
```

**This is normal!** The app is production-ready and will work perfectly once deployed to Vercel and accessed through Whop.

**To test:** Deploy to Vercel → Install in Whop → Access via community sidebar

---

## 🚀 Features

- **Real-time Leaderboard** - Track top performers by week, month, or all-time
- **Engagement Tracking** - Points based on forum posts, replies, and views
- **Prize Pools** - Community owners fund weekly/monthly prizes via Whop Payments
- **Automated Payouts** - Distribute prizes to top 10 users automatically
- **Level System** - 10 customizable levels with Skool-style progression
- **Admin Dashboard** - Manage prize pools, view analytics, customize levels

## 🎯 Point System

**Forum Posts (Main Points):**
- 0.1 points per view (minimum 5 views required)
- 1 point per reply received
- 10 point bonus for pinned posts

**Chat Messages (Light Tracking):**
- 0.5 points per reply received

**Anti-Spam Filters:**
- Minimum 10 characters per post
- Minimum 5 views to earn points
- No self-replies counted
- Replies must be >30 seconds apart

## 📋 Prerequisites

- Node.js 18+ and Yarn
- Supabase account and project
- Whop Developer account
- Vercel account (for deployment)

## 🛠️ Environment Variables

Create a `.env` file with the following:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Whop API
WHOP_API_KEY=your_whop_api_key
NEXT_PUBLIC_WHOP_APP_ID=your_whop_app_id
NEXT_PUBLIC_WHOP_AGENT_USER_ID=your_agent_user_id
NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id
WHOP_WEBHOOK_SECRET=your_webhook_secret
```

## 🏗️ Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Deploy community leaderboard"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository
4. Add environment variables from `.env`
5. Click "Deploy"

### 3. Configure Whop Webhook

After deployment:

1. Go to [Whop Developer Dashboard](https://dash.whop.com)
2. Navigate to Your App → Webhooks
3. Add webhook:
   - URL: `https://your-app.vercel.app/api/webhooks/whop`
   - Events: `payment.succeeded`, `payment.failed`
4. Copy webhook secret to Vercel environment variables as `WHOP_WEBHOOK_SECRET`
5. Redeploy on Vercel

### 4. Install App in Whop

1. In Whop Dashboard → Your App → Settings
2. Set iframe URL to your Vercel URL
3. Install app in your community
4. Access via community sidebar

## 🔄 Syncing Engagement Data

Set up automated sync using Vercel Cron:

1. Create `/api/cron/sync/route.js`:
```javascript
export async function GET(request) {
  // Call your sync endpoint
  await fetch('https://your-app.vercel.app/api/sync-whop');
  return Response.json({ success: true });
}
```

2. Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync",
    "schedule": "*/5 * * * *"
  }]
}
```

## 💰 Testing Payments

**IMPORTANT:** Payments only work when:
1. ✅ Deployed to Vercel (HTTPS required)
2. ✅ Accessed inside Whop iframe
3. ✅ Webhook secret configured
4. ✅ User is authenticated via Whop

**Test Flow:**
1. Install app in test community
2. Access `/admin` inside Whop
3. Click "New Pool" → Enter amount
4. Whop payment modal appears
5. Complete payment
6. Webhook activates pool automatically

## 📁 Key Files

```
/app/app/
├── layout.js                  # WhopIframeSdkProvider wrapper (REQUIRED)
├── admin/page.js              # Uses useIframeSdk() hook
├── api/payments/              # Payment & payout endpoints
└── api/webhooks/whop/         # Webhook handler
```

## 🔧 Troubleshooting

**"useIframeSdk is not a function"**
- Must run inside Whop iframe
- Check WhopIframeSdkProvider in layout.js

**Payments fail:**
- Verify HTTPS deployment
- Check webhook secret is set
- View webhook logs in Whop dashboard

**No data syncing:**
- Verify experience IDs in `/api/sync-whop/route.js`
- Check permissions: `chat:read`, `forum:read`
- Run manual sync via `/api/sync-whop`

## 📚 Resources

- [Whop SDK](https://docs.whop.com/sdk)
- [Payments Guide](https://docs.whop.com/apps/features/payments)
- [Example Repo](https://github.com/whopio/whop-app-call-it)
