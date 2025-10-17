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
      
      console.log('🔍 RAW SDK RESPONSE:', JSON.stringify(result, null, 2));
      
      // Whop SDK v5 returns data in experiencesV2 wrapper
      const experiencesData = result.experiencesV2 || result;
      const experiences = experiencesData.nodes || [];
      
      console.log('✅ Found experiences:', {
        companyId,
        totalCount: experiencesData.totalCount,
        experienceCount: experiences.length,
        experienceNames: experiences.map(e => e.name || e.id)
      });
      
      return {
        experiences: experiences,
        totalCount: experiencesData.totalCount,
        hasNextPage: experiencesData.pageInfo?.hasNextPage || false
      };
    } catch (error) {
      console.error('❌ Failed to list company experiences:', error);
      console.error('❌ Error stack:', error.stack);
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

/**
 * Ensure community exists in database
 * Creates community record if it doesn't exist
 * This is called when the app is first opened in a new community
 */
export async function ensureCommunityExists(companyContext) {
  try {
    const companyId = companyContext.company.companyId;
    
    console.log('🔍 Checking if community exists in DB:', companyId);
    
    // Check if community already exists
    const { data: existingCommunity, error: checkError } = await supabase
      .from('communities')
      .select('whop_company_id, name')
      .eq('whop_company_id', companyId)
      .single();
    
    if (existingCommunity) {
      console.log('✅ Community already exists:', existingCommunity.name);
      return existingCommunity;
    }
    
    // Community doesn't exist, create it
    console.log('📝 Creating new community record for:', companyContext.company.companyTitle);
    
    // Detect ALL forum and chat experiences by testing each one
    const forumExperiences = [];
    const chatExperiences = [];
    
    console.log(`🔎 Testing ${companyContext.allExperiences.length} experiences...`);
    
    for (const exp of companyContext.allExperiences) {
      // Test if it's a forum
      try {
        await whopSdk.forums.listForumPostsFromForum({
          experienceId: exp.id,
          first: 1
        });
        forumExperiences.push({
          id: exp.id,
          name: exp.name,
          description: exp.description
        });
        console.log('✅ Found forum:', exp.name, `(${exp.id})`);
      } catch (err) {
        console.log(`   ℹ️  ${exp.name} (${exp.id}) - Not a forum:`, err.message);
      }
      
      // Test if it's a chat
      try {
        await whopSdk.messages.listMessagesFromChat({
          chatExperienceId: exp.id,
          first: 1
        });
        chatExperiences.push({
          id: exp.id,
          name: exp.name,
          description: exp.description
        });
        console.log('✅ Found chat:', exp.name, `(${exp.id})`);
      } catch (err) {
        console.log(`   ℹ️  ${exp.name} (${exp.id}) - Not a chat:`, err.message);
      }
    }
    
    console.log(`📊 Detection complete: ${forumExperiences.length} forums, ${chatExperiences.length} chats`);
    
    const { data: newCommunity, error: insertError } = await supabase
      .from('communities')
      .insert({
        whop_company_id: companyId,
        name: companyContext.company.companyTitle || 'Community',
        owner_whop_user_id: 'system', // Will be updated when owner logs in
        settings: {
          logo: companyContext.company.companyLogo,
          route: companyContext.company.companyRoute,
          forumExperiences: forumExperiences,  // Array of all forums
          chatExperiences: chatExperiences,    // Array of all chats
          allExperiences: companyContext.allExperiences.map(exp => ({
            id: exp.id,
            name: exp.name,
            description: exp.description
          }))
        },
        level_names: {
          "1": "Newbie",
          "2": "Member",
          "3": "Regular",
          "4": "Active",
          "5": "Contributor",
          "6": "Veteran",
          "7": "Expert",
          "8": "Elite",
          "9": "Legend",
          "10": "Champion"
        }
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Failed to create community:', insertError);
      throw insertError;
    }
    
    console.log('✅ Community created successfully:', newCommunity.name);
    console.log(`   📋 Forums (${forumExperiences.length}):`, forumExperiences.map(f => f.name).join(', ') || 'None');
    console.log(`   💬 Chats (${chatExperiences.length}):`, chatExperiences.map(c => c.name).join(', ') || 'None');
    
    // Auto-sync engagement data for new community
    if (forumExperiences.length > 0 || chatExperiences.length > 0) {
      console.log('🔄 Auto-syncing engagement data for new community...');
      try {
        const { syncCommunityEngagement } = await import('./whop-sync.js');
        const syncResult = await syncCommunityEngagement(
          companyId,
          forumExperiences,
          chatExperiences
        );
        console.log('✅ Auto-sync complete:', syncResult.totals);
      } catch (syncError) {
        console.error('❌ Auto-sync failed (non-fatal):', syncError.message);
        // Don't throw - community was created successfully
      }
    }
    
    return newCommunity;
    
  } catch (error) {
    console.error('❌ Error ensuring community exists:', error);
    throw error;
  }
}