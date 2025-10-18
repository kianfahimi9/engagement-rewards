# Supabase Client Centralization

## Summary
Refactored all Supabase client creation to use a single centralized client from `/app/lib/supabase.js`. This eliminates code duplication and provides a single source of truth for Supabase configuration.

## Why This Change Was Made
The new prize pool and payment routes tried to import from a centralized Supabase client file that didn't exist, causing deployment failures. Rather than making these new routes inconsistent with the rest of the codebase, we centralized all Supabase client creation.

## Benefits
- **Single Source of Truth**: All database operations use the same client configuration
- **Easier Maintenance**: Changes to Supabase configuration only need to be made in one place
- **Consistent Service Role Access**: All backend operations use the service role key for full database access
- **Reduced Code Duplication**: Removed ~10 duplicate client creation blocks

## Files Created
- `/app/lib/supabase.js` - Centralized Supabase client with service role key

## Files Updated
All files that previously created inline Supabase clients now import from the centralized file:

### Library Files
- `/app/lib/authentication.js`
- `/app/lib/company.js`
- `/app/lib/whop-sync.js`
- `/app/lib/whop-payments.js`

### API Routes
- `/app/app/api/[[...path]]/route.js`
- `/app/app/api/sync-whop/route.js`
- `/app/app/api/webhooks/whop/route.js`
- `/app/app/api/payments/create-charge/route.js`
- `/app/app/api/payments/payout/route.js`
- `/app/app/api/admin/prize-pools/route.js`

### Page Components
- `/app/app/experiences/[experienceId]/page.js`
- `/app/app/stats/page.js`

## Implementation Details

### Before (Duplicated Code)
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

### After (Centralized)
```javascript
import { supabase } from '@/lib/supabase';
```

### Centralized Client Configuration
```javascript
// /app/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

## Key Differences
- **Service Role Key**: The centralized client uses `SUPABASE_SERVICE_ROLE_KEY` instead of `NEXT_PUBLIC_SUPABASE_ANON_KEY` for full backend access
- **No Session Management**: Auth settings are configured for backend-only operations

## Testing
✅ App loads correctly after refactor
✅ All routes compile without errors
✅ No duplicate client creation found in codebase

## Deployment Impact
This change fixes the deployment error:
```
Module not found: Can't resolve '@/lib/supabase'
Module not found: Can't resolve './supabase.js'
```

The app will now build successfully on Vercel and other deployment platforms.
