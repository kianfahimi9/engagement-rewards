/**
 * Whop Authentication Utilities
 * Verify user tokens and check experience access
 */

import { whopSdk } from '@/lib/whop-sdk';
import { getCompanyContext } from '@/lib/company';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';
import { cache } from 'react';

/**
 * Verify user token and check experience access
 * Cached to prevent duplicate API calls
 */
export const verifyUser = cache(
  async (experienceId, level) => {
    try {
      const headersList = await headers();
      const { userId } = await whopSdk.verifyUserToken(headersList);

      // New SDK method signature: checkAccess(resourceId, { id: userId })
      const { access_level: accessLevel } = await whopSdk.users.checkAccess(experienceId, { 
        id: userId 
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

      // First check if user is admin in Whop (includes owners)
      const isWhopAdmin = accessLevel === 'admin';
      
      // If they're a Whop admin, update the database owner
      if (isWhopAdmin) {
        const { data: communityData } = await supabase
          .from('communities')
          .select('owner_whop_user_id')
          .eq('whop_company_id', companyContext.company.companyId)
          .single();
        
        // Update owner if it's still 'system'
        if (communityData?.owner_whop_user_id === 'system') {
          console.log('📝 Setting community owner to:', userId);
          await supabase
            .from('communities')
            .update({ owner_whop_user_id: userId })
            .eq('whop_company_id', companyContext.company.companyId);
        }
      }
      
      // Now check database for owner status
      const { data: communityData } = await supabase
        .from('communities')
        .select('owner_whop_user_id')
        .eq('whop_company_id', companyContext.company.companyId)
        .single();
      
      const isOwner = communityData?.owner_whop_user_id === userId;
      
      console.log(`👤 User ${userId} owner check:`, {
        isOwner,
        dbOwner: communityData?.owner_whop_user_id,
        accessLevel,
        isWhopAdmin
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
