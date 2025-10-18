# Whop API 2025 Updates - Prize Pool Implementation

## Summary
Updated all prize pool and payment functionality to use the **latest Whop API released in 2025**. This ensures compatibility and follows current best practices.

## Key Changes

### 1. Checkout Configuration (NEW API)
**Old Method:** `whopSdk.payments.chargeUser()`  
**New Method:** `whopSdk.checkoutConfigurations.create()`

**Why:** Whop released a new checkout configuration API that provides better control and flexibility for one-time payments.

**Implementation:**
```javascript
const checkoutConfig = await whopSdk.checkoutConfigurations.create({
  plan: {
    company_id: companyId,
    plan_type: 'one_time',
    release_method: 'buy_now',
    currency: 'usd',
    initial_price: amountFloat,
    title: `Prize Pool - $${amountFloat}`,
    visibility: 'hidden'
  },
  metadata: {
    type: 'prize_pool_deposit',
    companyId, amount
  },
  redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin?...`
});
```

### 2. Ledger Account Balance Retrieval (UPDATED)
**Endpoint:** `GET /ledger_accounts/{id}`  
**SDK Method:** `whopSdk.ledgerAccounts.retrieve(ledgerAccountId)`

**Response Structure (2025):**
```javascript
{
  id: "ldgr_xxxxxxxxxxxxx",
  balances: [
    {
      balance: 6.9,
      currency: "usd",
      pending_balance: 6.9,
      reserve_balance: 6.9
    }
  ],
  ledger_type: "primary",
  owner: { id, name, username }
}
```

**Our Implementation:**
- Retrieves OUR APP's ledger balance (not individual community balances)
- Funds from all community prize pool payments accumulate in our app's ledger
- Available balance = balance - reserve_balance

### 3. Transfer API (CONFIRMED CORRECT)
**Endpoint:** `POST /transfers`  
**SDK Method:** `whopSdk.transfers.create()`

**Required Parameters:**
```javascript
{
  amount: 6.9,                    // Amount in dollars (not cents)
  currency: 'usd',
  origin_id: 'user_xxx',          // Sender (our app owner)
  destination_id: 'user_xxx',     // Recipient (community member)
  notes: 'Prize #1',              // Max 50 chars
  idempotence_key: 'unique-uuid'  // Prevent duplicates
}
```

**Required Permission:** `payout:transfer_funds` (must be enabled in Whop dashboard)

## Prize Pool Flow (Updated)

### Step 1: Community Owner Creates Prize Pool
1. Owner clicks "Create Pool" in admin dashboard
2. Enters amount (e.g., $100)
3. Our API creates checkout configuration using `checkoutConfigurations.create()`
4. Returns `purchase_url` for payment
5. Owner pays via Whop checkout (using existing balance OR credit card)
6. Payment goes to **OUR APP's ledger** (not community owner's ledger)

### Step 2: Database Tracking
```sql
prize_pools table:
- status: 'pending' (awaiting payment)
- status: 'active' (payment completed, via webhook)
- status: 'paid_out' (distributed to winners)
```

### Step 3: Prize Pool Distribution
1. Admin clicks "Pay Out Winners" button
2. Our API:
   - Fetches top 10 leaderboard winners
   - Checks OUR APP's ledger balance
   - Creates transfers from OUR ledger to each winner
   - Distribution: 40%, 18%, 12%, 8%, 6%, 5%, 4%, 3%, 2%, 2%
3. Uses `whopSdk.transfers.create()` for each payout
4. Records in `payouts` table

## Files Modified

### `/app/lib/whop-payments.js`
- `getAppLedgerBalance()` - NEW: Get our app's total balance
- `createTransfer()` - UPDATED: Uses latest transfer API
- `distributePrizePool()` - UPDATED: Transfers from our app to winners

### `/app/app/api/payments/create-charge/route.js`
- COMPLETELY REWRITTEN
- Now uses `checkoutConfigurations.create()`
- Returns `checkoutUrl` instead of `inAppPurchase`

### `/app/app/admin/admin.client.js`
- Updated to use `iframeSdk.openUrl(data.checkoutUrl)`
- Removed old charge API references

## Required Whop Dashboard Configuration

### Permissions Needed:
1. ✅ `checkout_configuration:create`
2. ✅ `plan:create`
3. ⚠️  `payout:transfer_funds` - **MUST BE ENABLED**
4. ✅ `company:balance:read`

### How to Enable:
1. Go to https://whop.com/dashboard/developer
2. Select your app
3. Go to "Permissions" tab
4. Enable `payout:transfer_funds`
5. Save changes

## Testing Checklist

### Before Production:
- [ ] Enable `payout:transfer_funds` permission in Whop dashboard
- [ ] Test prize pool creation with real payment
- [ ] Verify funds appear in OUR APP's ledger
- [ ] Test payout distribution to test users
- [ ] Verify transfer appears in recipient's Whop balance
- [ ] Test webhook handling for payment completion

### Test Environment:
- Use Whop's test mode if available
- Create small test prize pools ($1-5)
- Test with multiple community members

## Business Model Implementation

The updated architecture supports multiple monetization models:

### Current Implementation:
- Community owners pay for prize pools
- Funds go to OUR ledger
- We distribute to community members
- No transaction fees implemented yet

### Future Options:
1. **Transaction Fee:** Deduct % before distribution (e.g., 10% platform fee)
2. **Monthly Subscription:** Charge communities monthly, no transaction fees
3. **Hybrid:** Free tier with % fee, paid tier with no fees

## API Documentation References

- Checkout Configurations: https://docs.whop.com/api-reference/checkout-configurations/create-checkout-configuration
- Ledger Accounts: https://docs.whop.com/api-reference/ledger-accounts/retrieve-ledger-account
- Transfers: https://docs.whop.com/api-reference/transfers/create-transfer
- Payments (Retry): https://docs.whop.com/api-reference/payments/retry-payment
- Payments (Refund): https://docs.whop.com/api-reference/payments/refund-payment

## Notes

- All amounts are in **dollars** (not cents) for the 2025 API
- Ledger account ID format: `ldgr_xxxxxxxxxxxxx`
- User ID format: `user_xxxxxxxxxxxxx`
- Company ID format: `biz_xxxxxxxxxxxxx`
- Transfer notes max length: 50 characters
- Idempotence keys recommended for all transfers
