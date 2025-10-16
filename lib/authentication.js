/**
 * Whop Authentication Utilities
 * Verify user tokens and check experience access
 */

import { whopSdk } from '@/lib/whop-sdk';
import { getCompanyContext } from '@/lib/company';
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

      return { 
        userId, 
        accessLevel,
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
