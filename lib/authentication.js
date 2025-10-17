/**
 * Whop Authentication Utilities
 * Verify user tokens and check experience access
 */

import { whopSdk } from '@/lib/whop-sdk';
import { getCompanyContext } from '@/lib/company';
import { headers } from 'next/headers';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Verify user token and check experience access
 * Cached to prevent duplicate API calls
 */
export const verifyUser = cache(
  async (experienceId, level) => {
    try {
      const headersList = await headers();
      const { userId } = await whopSdk.verifyUserToken(headersList);

      const { accessLevel } = await whopSdk.access.checkIfUserHasAccessToExperience({
        userId,
        experienceId,
      });

      // Check if user has required access level
      if (level && accessLevel !== level) {
        throw new Error('User must be an admin to access this page');
      }
      
      if (accessLevel === 'no_access') {
        throw new Error('User does not have access to experience');
      }

      // Get company context for this experience
      const companyContext = await getCompanyContext(experienceId);

      // Check if user is the community owner from database
      const { data: communityData } = await supabase
        .from('communities')
        .select('owner_whop_user_id')
        .eq('whop_company_id', companyContext.company.companyId)
        .single();
      
      const isOwner = communityData?.owner_whop_user_id === userId;
      
      console.log(`👤 User ${userId} owner check:`, {
        isOwner,
        dbOwner: communityData?.owner_whop_user_id,
        accessLevel
      });

      return { 
        userId, 
        accessLevel,
        isOwner,
        companyContext
      };
    } catch (error) {
      console.error('❌ Auth verification error:', error);
      throw error;
    }
  }
);

/**
 * Get current user from headers (client-side safe)
 */
export async function getCurrentUser() {
  try {
    const headersList = await headers();
    const { userId } = await whopSdk.verifyUserToken(headersList);
    return userId;
  } catch (error) {
    console.error('❌ Failed to get current user:', error);
    return null;
  }
}
