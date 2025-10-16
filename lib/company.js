/**
 * Whop Company Utilities
 * Handle company/community identification and operations
 */

import { whopSdk } from '@/lib/whop-sdk';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Get company information from experience ID
 * Uses Whop SDK following their exact documentation
 * Cached to prevent duplicate API calls
 */
export const getCompanyFromExperience = cache(
  async (experienceId) => {
    try {
      console.log('🏢 Getting company from experience:', experienceId);
      
      // Following Whop docs: whopSdk.experiences.getExperience()
      const experience = await whopSdk.experiences.getExperience({
        experienceId: experienceId
      });
      
      // Extract company from experience object (per Whop docs)
      const company = experience.company;
      
      if (!company || !company.id) {
        throw new Error('No company found for experience');
      }
      
      console.log('✅ Company identified:', {
        companyId: company.id,
        companyTitle: company.title,
        experienceId: experienceId
      });
      
      return {
        companyId: company.id,
        companyTitle: company.title,
        companyRoute: company.route,
        companyLogo: company.logo?.sourceUrl,
        experience: {
          id: experience.id,
          name: experience.name,
          description: experience.description
        }
      };
    } catch (error) {
      console.error('❌ Failed to get company from experience:', error);
      throw new Error(`Unable to identify company for experience ${experienceId}: ${error.message}`);
    }
  }
);

/**
 * List all experiences in a company
 * Following Whop docs: whopSdk.experiences.listExperiences()
 */
export const listCompanyExperiences = cache(
  async (companyId) => {
    try {
      console.log('📋 Listing experiences for company:', companyId);
      
      // Following Whop docs: listExperiences with companyId
      const result = await whopSdk.experiences.listExperiences({
        companyId: companyId,
        first: 50 // Get up to 50 experiences
      });
      
      const experiences = result.nodes || [];
      
      console.log('✅ Found experiences:', {
        companyId,
        totalCount: result.totalCount,
        experienceCount: experiences.length
      });
      
      return {
        experiences: experiences,
        totalCount: result.totalCount,
        hasNextPage: result.pageInfo?.hasNextPage || false
      };
    } catch (error) {
      console.error('❌ Failed to list company experiences:', error);
      throw new Error(`Unable to list experiences for company ${companyId}: ${error.message}`);
    }
  }
);

/**
 * Get company context for our app
 * This combines getting company info and listing experiences
 */
export const getCompanyContext = cache(
  async (ourAppExperienceId) => {
    try {
      console.log('🔍 Getting full company context for app:', ourAppExperienceId);
      
      // Step 1: Get company from our app's experience ID
      const companyInfo = await getCompanyFromExperience(ourAppExperienceId);
      
      // Step 2: List all experiences in this company
      const experienceList = await listCompanyExperiences(companyInfo.companyId);
      
      // Step 3: Return all experiences for engagement tracking
      // Engagement tracking will attempt to track all experiences and naturally
      // only succeed with actual chat/forum experiences (fail gracefully for others)
      const context = {
        company: companyInfo,
        allExperiences: experienceList.experiences,
        trackingTargets: experienceList.experiences, // Try tracking all experiences
        ourApp: {
          experienceId: ourAppExperienceId,
          name: companyInfo.experience.name
        }
      };
      
      console.log('✅ Company context established:', {
        companyId: companyInfo.companyId,
        totalExperiences: experienceList.experiences.length,
        trackingTargets: experienceList.experiences.length
      });
      
      return context;
    } catch (error) {
      console.error('❌ Failed to get company context:', error);
      throw error;
    }
  }
);