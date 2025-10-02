# Whop Community Engagement Leaderboard

A gamified community engagement tracking and reward system for the Whop ecosystem. Inspired by Skool's leaderboard system with enhanced gamification similar to Duolingo and Clash of Clans.

## Features

### 🏆 Community Leaderboard
- Real-time rankings (Weekly, Monthly, All-Time)
- Beautiful gamified UI with dodger blue/amber theme
- Top performer highlights with special badges
- Active prize pool display
- Personal rank tracking

### 📊 User Stats Dashboard
- Personal engagement metrics
- Earning history and status
- Badge/achievement system
- Daily streak tracking
- Level progression system
- Activity breakdown

### 👑 Admin Dashboard (Community Owners)
- Community analytics overview
- Prize pool management
- Payout processing via Whop
- Engagement metrics tracking
- Member activity monitoring

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Payments**: Whop Native Payments (to be integrated)
- **Authentication**: Whop OAuth (to be integrated)

## Database Schema

### Core Tables:
- `communities` - Whop community tracking
- `users` - User profiles with whop_user_id
- `community_members` - User-community relationships
- `daily_streaks` - Track user daily activity streaks
- `leaderboard_entries` - Computed rankings by period
- `prize_pools` - Weekly/monthly reward pools
- `payouts` - Payment records to users

## Getting Started

1. **Install dependencies:**
```bash
yarn install
```

2. **Configure environment variables:**
Create a `.env` file with:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Whop (to be added)
WHOP_API_KEY=your_whop_api_key
WHOP_CLIENT_ID=your_client_id
WHOP_CLIENT_SECRET=your_client_secret
```

3. **Start the development server:**
```bash
yarn dev
```

## Project Structure

```
/app
├── app/
│   ├── page.js              # Community Leaderboard
│   ├── stats/page.js        # User Stats Dashboard
│   ├── admin/page.js        # Admin Dashboard
│   └── api/[[...path]]/route.js  # API endpoints
├── components/ui/           # shadcn/ui components
└── .env                     # Environment variables
```

## API Endpoints

### Public Endpoints
- `GET /api/leaderboard?period={weekly|monthly|all_time}` - Get leaderboard rankings
- `GET /api/user-stats` - Get current user statistics
- `POST /api/sync-engagement` - Webhook for Whop engagement sync

### Admin Endpoints
- `GET /api/admin/dashboard` - Get admin dashboard data
- `POST /api/admin/prize-pool` - Create new prize pool
- `POST /api/admin/process-payouts` - Process payouts for completed prize pool

## Engagement Point System

| Action | Points |
|--------|--------|
| Daily Login | +5 pts |
| Receive a Like | +2 pts |
| Receive a Comment | +3 pts |
| Get Shared | +5 pts |
| 7-Day Streak Bonus | +50 pts |
| 30-Day Streak Bonus | +200 pts |

## Prize Pool Distribution

- 🥇 **1st Place**: 40%
- 🥈 **2nd Place**: 30%
- 🥉 **3rd Place**: 20%
- 🎖️ **4th-10th**: 10% (shared)

## Integration Guide

### Whop Authentication
1. Set up Whop OAuth in your app settings
2. Implement OAuth flow
3. Store whop_user_id in user sessions

### Whop Engagement Sync
1. Set up webhooks in Whop dashboard
2. Configure webhook endpoint: `/api/sync-engagement`
3. Process events: post_created, comment_created, like_created

### Whop Payment Integration
1. Use Whop's payment API for payouts
2. Implement in `/api/admin/process-payouts`
3. Track payment status in `payouts` table

## License

Proprietary - Built for Whop Ecosystem
