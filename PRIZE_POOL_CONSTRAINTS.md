# Prize Pool Constraints & Edit Policy

**Date:** January 2025  
**Purpose:** Document prize pool overlap prevention and edit restrictions

---

## 🎯 Goal: Simple & Clean System

**Core Rule:** Only ONE active/pending prize pool can exist at any given time for a community.

---

## 🚫 Overlap Prevention

### How It Works

1. **Before Creating a Prize Pool:**
   - System checks all existing `pending` and `active` pools
   - Compares date ranges to detect overlaps
   - Rejects creation if any overlap is found

2. **Overlap Detection Logic:**
   ```javascript
   // New pool overlaps if:
   - New starts during existing pool
   - New ends during existing pool  
   - New encompasses existing pool completely
   ```

3. **User Feedback:**
   - Clear error message: "Prize pool overlaps with existing weekly pool ($100)"
   - Helpful suggestion: "Schedule your pool to start after [date]"
   - Toast notification with detailed info

### Example Scenarios

✅ **ALLOWED:**
```
Existing: Weekly pool (Jan 1 - Jan 7)
New:      Weekly pool (Jan 8 - Jan 14)  ← Starts after existing ends
```

❌ **BLOCKED:**
```
Existing: Weekly pool (Jan 1 - Jan 7)
New:      Weekly pool (Jan 5 - Jan 12)  ← Overlaps with existing
```

❌ **BLOCKED:**
```
Existing: Weekly pool (Jan 1 - Jan 7)
New:      Monthly pool (Jan 1 - Jan 30)  ← Encompasses existing
```

---

## ✏️ Edit & Delete Policy

### Status-Based Permissions

| Status | Description | Can Edit | Can Delete | Notes |
|--------|-------------|----------|------------|-------|
| **🟡 Pending** | Payment not yet made | ❌ No | ✅ Yes | Must create new pool instead |
| **📅 Scheduled** | Payment made, start date in future | ❌ No | ✅ Yes | Can delete before it starts |
| **🟢 Active** | Currently running | ❌ No | ❌ No | Users already paid, locked |
| **⏰ Ended** | End date passed, awaiting payout | ❌ No | ❌ No | Ready for distribution |
| **✅ Paid Out** | Completed | ❌ No | ❌ No | Historical record |

### Simple Rules

1. **Pending/Scheduled Pools:**
   - Can be deleted
   - Cannot be edited (must delete and recreate)

2. **Active/Ended/Paid Pools:**
   - Completely locked
   - No edits, no deletions
   - Historical record preserved

**Why No Editing?**
- Keeps system simple and predictable
- Prevents confusion about which pool users paid for
- Avoids complex refund logic
- Community owners can just delete and recreate pending pools

---

## 🎨 UI Status Indicators

### Visual States

```
🟢 Active        - Green badge, "Distribute to Winners" button
📅 Scheduled     - Yellow badge, "Delete" button, countdown
⏰ Ended         - Purple badge, "Distribute to Winners" button  
✅ Paid Out      - Blue badge, read-only
```

### Status Calculation Logic

```javascript
if (status === 'paid_out') → "✅ Paid Out"
else if (status === 'active' && now > end_date) → "⏰ Ended - Ready for Payout"
else if (status === 'active') → "🟢 Active"
else if (status === 'pending' && now < start_date) → "📅 Scheduled"
```

---

## 💡 User Experience

### Creating a Prize Pool

1. User clicks "Create Pool"
2. Enters amount, period type, start date
3. System auto-calculates end date
4. System validates dates (no past dates, no overlaps)
5. If overlap detected:
   - ❌ Shows clear error with suggestion
   - 📅 Suggests next available start date
6. If valid:
   - ✅ Opens Whop payment modal
   - Creates pool with 'pending' status

### Managing Pools

**Scheduled Pool (before start date):**
- See countdown: "⏳ Starts in 5 days"
- Can delete if plans change
- Shows payment was successful

**Active Pool (during period):**
- See "🟢 Active" badge
- Wait for end date
- No changes allowed

**Ended Pool (after end date):**
- See "⏰ Ended - Ready for Payout" badge
- Click "💰 Distribute to Winners"
- System distributes proportionally

**Paid Out:**
- See "✅ Paid Out" badge
- View historical record
- No actions available

---

## 🔧 Technical Implementation

### Backend Validation

**File:** `/app/app/api/admin/prize-pools/route.js`

```javascript
// Check for overlaps before INSERT
const existingPools = await supabase
  .from('prize_pools')
  .select('*')
  .eq('whop_company_id', companyId)
  .in('status', ['pending', 'active']);

// Validate date ranges
for (const pool of existingPools) {
  if (hasOverlap(newPool, pool)) {
    return 409 Conflict error with details
  }
}
```

### Edit/Delete Endpoints

**PUT /api/admin/prize-pools:**
- Rejects all edit attempts (simplified)
- Returns 403 Forbidden

**DELETE /api/admin/prize-pools:**
- Only allows deletion if status = 'pending'
- Returns 403 Forbidden for active/ended/paid pools

### Frontend UI

**File:** `/app/app/admin/admin.client.js`

```javascript
// Status-aware rendering
const statusInfo = getStatusInfo(pool);

// Show appropriate buttons
if (statusInfo.canDelete) {
  <Button onClick={() => handleDeletePool(pool.id)}>Delete</Button>
}

// Handle overlap errors
if (response.status === 409) {
  toast.error('Schedule Conflict', {
    description: data.error + suggestion
  });
}
```

---

## ✅ Benefits of This System

1. **🎯 Simple:** One rule - no overlaps
2. **🛡️ Safe:** No accidental double charges
3. **📊 Clear:** Users always know current pool status
4. **⚡ Fast:** No complex refund/edit logic
5. **🔒 Trustworthy:** Locked pools maintain integrity

---

## 📋 Testing Checklist

- [x] Prevent creating overlapping pools
- [x] Show clear error messages with suggestions
- [x] Display status badges correctly
- [x] Allow deleting scheduled pools
- [x] Block deleting active/paid pools
- [x] Show countdown for scheduled pools
- [x] Enable distribution button for ended pools
- [ ] **USER TODO:** Test full flow in production

---

## 🚀 Future Enhancements (Optional)

If users request more flexibility later:

1. **Calendar View:** Visual timeline of scheduled pools
2. **Bulk Scheduling:** Queue multiple future pools at once
3. **Recurring Pools:** Auto-create weekly/monthly pools
4. **Edit Grace Period:** Allow edits within X hours of creation

**For now: Keep it simple!** ✨
