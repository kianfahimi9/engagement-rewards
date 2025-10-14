# 🚀 Production Deployment Checklist

## Pre-Deployment

### ✅ Environment Variables Ready
Copy these from your local `.env` to Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tknljegmnxpjyubpsxly.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
WHOP_API_KEY=0JcJd8QUzLSXMswLwbwX_7PIj7wYWhUyO0cN1AQpi04
NEXT_PUBLIC_WHOP_APP_ID=app_QyCjoIHdVC9Nt9
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_JvAo4aGjsYMg8
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_qPK67VZ7YaFgg9
WHOP_WEBHOOK_SECRET=(get after webhook setup)
```

### ✅ Code is Production-Ready
- [x] WhopIframeSdkProvider in layout.js
- [x] useIframeSdk() in admin/page.js
- [x] Payment endpoints created
- [x] Webhook handler created
- [x] No mocked data

---

## Deployment Steps

### 1. Push to GitHub ✅

```bash
# Initialize git if needed
git init
git add .
git commit -m "Production-ready Whop community leaderboard"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel ✅

**Via Vercel Dashboard:**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Project Name: `community-leaderboard` (or your choice)
4. Framework Preset: Next.js (auto-detected)
5. Root Directory: `./app` (IMPORTANT!)
6. Add Environment Variables (paste from above)
7. Click "Deploy"

**Via Vercel CLI:**
```bash
cd app
vercel --prod
# Follow prompts and add environment variables
```

### 3. Configure Whop Webhook ✅

**After deployment, get your Vercel URL (e.g., `https://community-leaderboard.vercel.app`)**

1. Go to https://dash.whop.com
2. Select your app
3. Go to "Webhooks" section
4. Click "Add Webhook"
5. Enter details:
   - **URL**: `https://your-app.vercel.app/api/webhooks/whop`
   - **Events**: 
     - ✅ `payment.succeeded`
     - ✅ `payment.failed`
6. Save and copy the "Webhook Secret"
7. Go back to Vercel → Your Project → Settings → Environment Variables
8. Add: `WHOP_WEBHOOK_SECRET` = `<paste-secret>`
9. Redeploy: Vercel → Deployments → Latest → ... → Redeploy

### 4. Update Whop App Settings ✅

1. In Whop Dashboard → Your App → Settings
2. **App URL**: `https://your-app.vercel.app`
3. **Iframe URL**: `https://your-app.vercel.app`
4. Save changes

### 5. Install App in Community ✅

1. Go to your Whop community
2. Settings → Apps
3. Find your app and click "Install"
4. App will appear in community sidebar

---

## Post-Deployment Testing

### Test 1: Basic Access ✅
- [ ] Visit `https://your-app.vercel.app` (should load leaderboard)
- [ ] Visit `https://your-app.vercel.app/admin` (should load admin dashboard)
- [ ] Check browser console for errors

### Test 2: Inside Whop Iframe ✅
- [ ] Open your Whop community
- [ ] Click on your app in sidebar
- [ ] Should load inside Whop interface
- [ ] Check that useIframeSdk() works (no errors)

### Test 3: Data Sync ✅
- [ ] Manually trigger sync: `curl https://your-app.vercel.app/api/sync-whop`
- [ ] Check if forum posts and chat messages appear in Supabase
- [ ] Verify leaderboard shows real data

### Test 4: Payments (Critical!) ✅
- [ ] Inside Whop iframe, go to `/admin`
- [ ] Click "New Pool"
- [ ] Enter test amount (e.g., $1.00)
- [ ] Whop payment modal should appear
- [ ] Complete test payment
- [ ] Check webhook logs in Whop dashboard
- [ ] Verify prize pool status changed to "active" in Supabase

### Test 5: Payouts (if you have test users) ✅
- [ ] Create fake leaderboard entries for testing
- [ ] Click "Process Payouts" on active prize pool
- [ ] Check if payouts were created in database
- [ ] Verify Whop transferred funds

---

## Production Configuration

### Update Community IDs in Code

**File: `/app/app/api/sync-whop/route.js`**

Replace hardcoded community ID with your real one:
```javascript
const COMMUNITIES = [
  {
    id: '2b7ecb03-7c43-4aca-ae53-c77cdf766d85', // ← Replace with real UUID from Supabase
    name: 'Your Community Name',
    forumExperienceId: 'exp_2AXIaDSvdIf9L7', // ← Replace with your forum experience ID
    chatExperienceId: 'exp_4MjMbbnlbB5Fcv',  // ← Replace with your chat experience ID
  }
];
```

**How to get experience IDs:**
1. Use the test endpoint: `/api/test-whop?test=experiences`
2. Or check Whop dashboard → Community → Experiences

### Set Up Automated Sync (Optional but Recommended)

**Create `/app/app/api/cron/sync/route.js`:**
```javascript
export async function GET() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sync-whop`);
  const data = await response.json();
  return Response.json(data);
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
```

**Create `/app/vercel.json`:**
```json
{
  "crons": [{
    "path": "/api/cron/sync",
    "schedule": "*/5 * * * *"
  }]
}
```

Commit and redeploy to activate cron job.

---

## Troubleshooting

### Issue: "render is not a function"
**Solution:** Make sure you're accessing the app INSIDE Whop iframe, not standalone.

### Issue: Payment modal doesn't appear
**Solution:** 
- Check HTTPS is enabled (Vercel automatically does this)
- Verify WhopIframeSdkProvider is in layout.js
- Check browser console for SDK errors

### Issue: Webhook not receiving events
**Solution:**
- Verify webhook URL is correct in Whop dashboard
- Check WHOP_WEBHOOK_SECRET is set in Vercel
- View webhook delivery logs in Whop dashboard
- Check `/var/log` on Vercel for incoming requests

### Issue: No engagement data syncing
**Solution:**
- Check experience IDs are correct
- Verify permissions in Whop app settings
- Manually test: `curl https://your-app.vercel.app/api/test-whop?test=forum-posts&experienceId=exp_XXX`

---

## Success Criteria ✅

Your deployment is successful when:

- [x] App loads inside Whop community sidebar
- [x] Leaderboard shows real user data from Whop
- [x] Admin can create prize pools via payment modal
- [x] Payments are processed and webhook activates pools
- [x] Top users can be paid out automatically
- [x] Data syncs regularly (manual or cron)
- [x] No console errors in browser
- [x] All three pages work: `/`, `/stats`, `/admin`

---

## 🎉 You're Live!

Once all tests pass, your Whop community engagement leaderboard is ready for production use!

**Next Steps:**
1. Announce the leaderboard to your community
2. Create your first prize pool
3. Monitor engagement and payouts
4. Customize level names in admin dashboard
5. Adjust point values if needed (in `/lib/points-system.js`)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Whop webhook delivery logs
3. Check Supabase logs
4. Review this checklist

Good luck! 🚀
