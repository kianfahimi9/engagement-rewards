# Prize Pool Schema Alignment Analysis

## Current Issues Found

### 1. Column Name Mismatch ⚠️

**Problem:** Code uses different column names than schema expects

**In Code:**
- `whop_checkout_id` (new implementation using checkout configurations)

**In Schema/Webhook:**
- `whop_charge_id` (old implementation)

**Impact:** Webhooks won't be able to update prize pool status from pending → active

### 2. Missing Columns

**Our Implementation Needs:**
```sql
prize_pools table:
- id: uuid (PK) ✅
- whop_company_id: text ✅ (renamed from community_id)
- amount: numeric ✅
- currency: text ✅
- period_start: date ✅
- period_end: date ✅
- status: text ✅
- whop_checkout_id: text ⚠️ (NEW - for checkout configuration ID)
- whop_charge_id: text ⚠️ (KEEP - for backward compatibility)
- whop_payment_id: text ✅ (set after webhook confirms payment)
- paid_out_at: timestamptz ⚠️ (NEW - when winners were paid)
- winners_count: integer ⚠️ (NEW - how many winners were paid)
- created_at: timestamptz ✅
- updated_at: timestamptz ✅
```

### 3. Payouts Table Schema

**Our Implementation Needs:**
```sql
payouts table:
- id: uuid (PK) ✅
- prize_pool_id: uuid (FK) ✅
- whop_user_id: text ⚠️ (NEW - Whop user ID)
- whop_company_id: text ⚠️ (NEW - for multi-community tracking)
- amount: numeric ✅
- rank: integer ✅
- status: text ✅
- whop_transfer_id: text ⚠️ (NEW - from transfers.create())
- points_earned: numeric ⚠️ (NEW - user's points that won)
- created_at: timestamptz ✅
- paid_at: timestamptz ✅
```

## Required Database Migrations

### Migration 1: Add Missing Columns to prize_pools

```sql
-- Add new columns for latest Whop API implementation
ALTER TABLE prize_pools 
  ADD COLUMN IF NOT EXISTS whop_checkout_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS winners_count INTEGER DEFAULT 0;

-- Rename community_id to whop_company_id for clarity
ALTER TABLE prize_pools 
  RENAME COLUMN community_id TO whop_company_id;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_prize_pools_checkout 
  ON prize_pools(whop_checkout_id);

CREATE INDEX IF NOT EXISTS idx_prize_pools_status_company 
  ON prize_pools(status, whop_company_id);
```

### Migration 2: Update Payouts Table

```sql
-- Add missing columns
ALTER TABLE payouts 
  ADD COLUMN IF NOT EXISTS whop_user_id TEXT,
  ADD COLUMN IF NOT EXISTS whop_company_id TEXT,
  ADD COLUMN IF NOT EXISTS whop_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS points_earned NUMERIC DEFAULT 0;

-- Rename user_id to match FK pattern (if it exists as user_id)
-- This depends on current schema - check first!

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payouts_user 
  ON payouts(whop_user_id);

CREATE INDEX IF NOT EXISTS idx_payouts_transfer 
  ON payouts(whop_transfer_id);
```

## Data Flow Verification

### Prize Pool Creation Flow
1. **API Call:** `/api/payments/create-charge`
   - Creates checkout configuration
   - Inserts into `prize_pools` with:
     - `status: 'pending'`
     - `whop_checkout_id: checkoutConfig.id`
     - `whop_company_id: companyId`

2. **User Pays:** Via Whop checkout modal
   - Payment processed by Whop
   - Funds go to OUR app's ledger

3. **Webhook:** `/api/webhooks/whop` receives payment.succeeded
   - Needs to match by `whop_charge_id` OR `whop_checkout_id`
   - Updates `status: 'active'`
   - Sets `whop_payment_id`

4. **Admin Payout:** `/api/admin/payout`
   - Fetches top 10 winners from `leaderboard_entries`
   - Creates transfers via `whopSdk.transfers.create()`
   - Inserts into `payouts` with `whop_transfer_id`
   - Updates prize pool `status: 'paid_out'`, `paid_out_at`, `winners_count`

## Current Code Issues

### Issue 1: Webhook Won't Match Prize Pools
**Location:** `/app/app/api/webhooks/whop/route.js`

**Current Code:**
```javascript
.eq('whop_charge_id', data.id)
```

**Problem:** We're storing `whop_checkout_id` but webhook looks for `whop_charge_id`

**Fix Needed:** Update webhook to check both columns:
```javascript
const { data: prizePool } = await supabase
  .from('prize_pools')
  .select('*')
  .or(`whop_charge_id.eq.${data.id},whop_checkout_id.eq.${data.checkout_session_id}`)
  .single();
```

### Issue 2: Missing Period Type
**Location:** Multiple queries reference `period_type` but prize_pools doesn't have it

**Options:**
1. Add `period_type` column to `prize_pools` ('weekly', 'monthly')
2. Infer from `period_start` and `period_end` dates
3. Use a default ('weekly')

**Recommendation:** Add `period_type` column

## Action Items

### Immediate Fixes (Code Only - No Migration Needed Yet)

1. ✅ **Fixed:** Remove `title` field from insert
2. ⚠️ **TODO:** Update webhook to handle new checkout configuration IDs
3. ⚠️ **TODO:** Add `period_type` parameter to prize pool creation
4. ⚠️ **TODO:** Verify admin dashboard queries work with current schema

### Database Migrations Needed

Run these Supabase migrations BEFORE deploying to production:

```sql
-- Migration: Update prize_pools for 2025 API
ALTER TABLE prize_pools 
  ADD COLUMN IF NOT EXISTS whop_checkout_id TEXT,
  ADD COLUMN IF NOT EXISTS period_type TEXT DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS paid_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS winners_count INTEGER DEFAULT 0;

-- Migration: Update payouts table
ALTER TABLE payouts 
  ADD COLUMN IF NOT EXISTS whop_user_id TEXT,
  ADD COLUMN IF NOT EXISTS whop_company_id TEXT,
  ADD COLUMN IF NOT EXISTS whop_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS points_earned NUMERIC DEFAULT 0;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_prize_pools_checkout ON prize_pools(whop_checkout_id);
CREATE INDEX IF NOT EXISTS idx_prize_pools_status_company ON prize_pools(status, whop_company_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user ON payouts(whop_user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_transfer ON payouts(whop_transfer_id);
```

## Testing Checklist

- [ ] Create prize pool via admin dashboard
- [ ] Verify database insert with correct columns
- [ ] Complete payment via Whop checkout
- [ ] Verify webhook updates status to 'active'
- [ ] Trigger payout to top 10
- [ ] Verify transfers created in Whop
- [ ] Verify payouts table populated
- [ ] Verify prize pool marked as 'paid_out'

## Summary

**Status:** ⚠️ Partially Aligned

**What Works:**
- Prize pool creation API
- Checkout configuration generation
- Database insert (with some missing columns)

**What Needs Fixing:**
1. Add missing columns via Supabase migration
2. Update webhook to handle new checkout IDs
3. Add period_type support
4. Test end-to-end flow

**Recommendation:** Run database migrations first, then test complete flow in staging.
