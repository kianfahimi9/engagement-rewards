/**
 * COMPREHENSIVE WHOP FLOW TEST
 * 
 * Purpose: Test the COMPLETE flow of identifying a community and tracking engagement
 * 
 * Flow:
 * 1. Start with our app's experienceId (exp_4jHgqrvf1Evc0U)
 * 2. Extract the companyId from the experience
 * 3. List all experiences in that company
 * 4. Identify forum and chat experiences
 * 5. Fetch sample engagement data
 * 6. Verify we can track users across experiences
 */

import { NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET(request) {
  const results = {
    timestamp: new Date().toISOString(),
    ourAppExperienceId: 'exp_4jHgqrvf1Evc0U',
    steps: [],
    summary: {}
  };

  console.log('\n═══════════════════════════════════════════════');
  console.log('🧪 COMPREHENSIVE WHOP FLOW TEST');
  console.log('═══════════════════════════════════════════════\n');

  try {
    // ===================================================================
    // STEP 1: Get our app's experience details
    // ===================================================================
    console.log('📍 STEP 1: Getting our app experience details...');
    console.log('Experience ID:', results.ourAppExperienceId);
    
    let experience;
    try {
      experience = await whopSdk.experiences.getExperience({
        experienceId: results.ourAppExperienceId
      });
      
      results.steps.push({
        step: 1,
        name: 'Get App Experience',
        success: true,
        data: experience,
        notes: [
          'Retrieved experience object',
          `Company ID: ${experience?.company?.id || 'NOT FOUND'}`,
          `Company Title: ${experience?.company?.title || 'NOT FOUND'}`
        ]
      });
      
      console.log('✅ Experience retrieved');
      console.log('   Company ID:', experience?.company?.id);
      console.log('   Company Title:', experience?.company?.title);
      console.log('   Experience Type:', experience?.type);
      console.log('   Experience Name:', experience?.name);
      
    } catch (error) {
      results.steps.push({
        step: 1,
        name: 'Get App Experience',
        success: false,
        error: error.message,
        errorStack: error.stack
      });
      throw new Error(`Step 1 Failed: ${error.message}`);
    }

    // ===================================================================
    // STEP 2: Extract and validate companyId
    // ===================================================================
    console.log('\n📍 STEP 2: Extracting companyId...');
    
    const companyId = experience?.company?.id;
    
    if (!companyId) {
      throw new Error('❌ CRITICAL: No companyId found in experience object!');
    }
    
    results.summary.companyId = companyId;
    results.summary.companyTitle = experience?.company?.title;
    
    results.steps.push({
      step: 2,
      name: 'Extract Company ID',
      success: true,
      data: {
        companyId: companyId,
        companyTitle: experience?.company?.title,
        extractionMethod: 'experience.company.id'
      },
      notes: [
        '✅ Successfully extracted companyId from experience',
        'This is the community where our app is installed'
      ]
    });
    
    console.log('✅ Company ID extracted:', companyId);

    // ===================================================================
    // STEP 3: Get full company details
    // ===================================================================
    console.log('\n📍 STEP 3: Getting company details...');
    
    let company;
    try {
      company = await whopSdk.companies.getCompany({
        companyId: companyId
      });
      
      results.steps.push({
        step: 3,
        name: 'Get Company Details',
        success: true,
        data: company,
        notes: [
          'Retrieved full company information',
          `Owner: ${company?.ownerId || 'Unknown'}`,
          `Created: ${company?.createdAt || 'Unknown'}`
        ]
      });
      
      console.log('✅ Company details retrieved');
      console.log('   Title:', company?.title);
      console.log('   Owner ID:', company?.ownerId);
      console.log('   Description:', company?.description?.substring(0, 100));
      
    } catch (error) {
      results.steps.push({
        step: 3,
        name: 'Get Company Details',
        success: false,
        error: error.message
      });
      console.log('⚠️  Could not get company details:', error.message);
      // Continue anyway
    }

    // ===================================================================
    // STEP 4: List ALL experiences in the community
    // ===================================================================
    console.log('\n📍 STEP 4: Listing all experiences in community...');
    
    let allExperiences;
    try {
      // Using EXACT Whop SDK method signature from official docs
      allExperiences = await whopSdk.experiences.listExperiences({
        companyId: companyId,  // Required parameter
        first: 100  // Optional: Get up to 100 experiences
      });
      
      const experiences = allExperiences?.experiencesV2?.nodes || [];  // EXACT response structure from docs
      
      // Categorize experiences by type
      // NOTE: We need to test what values 'app.name' or other fields contain to identify forums/chats
      const forumExperiences = experiences.filter(e => 
        e.app?.name?.toLowerCase().includes('forum') || e.name?.toLowerCase().includes('forum')
      );
      
      const chatExperiences = experiences.filter(e => 
        e.app?.name?.toLowerCase().includes('chat') || e.name?.toLowerCase().includes('chat')
      );
      
      const otherExperiences = experiences.filter(e => 
        !forumExperiences.includes(e) && !chatExperiences.includes(e)
      );
      
      results.steps.push({
        step: 4,
        name: 'List All Experiences',
        success: true,
        data: {
          totalCount: experiences.length,
          forums: forumExperiences.map(e => ({ id: e.id, name: e.name, type: e.type })),
          chats: chatExperiences.map(e => ({ id: e.id, name: e.name, type: e.type })),
          others: otherExperiences.map(e => ({ id: e.id, name: e.name, type: e.type }))
        },
        notes: [
          `Found ${experiences.length} total experiences`,
          `Forums: ${forumExperiences.length}`,
          `Chats: ${chatExperiences.length}`,
          `Others: ${otherExperiences.length}`
        ]
      });
      
      results.summary.totalExperiences = experiences.length;
      results.summary.forumCount = forumExperiences.length;
      results.summary.chatCount = chatExperiences.length;
      results.summary.forumIds = forumExperiences.map(e => e.id);
      results.summary.chatIds = chatExperiences.map(e => e.id);
      
      console.log('✅ Experiences listed');
      console.log('   Total:', experiences.length);
      console.log('   Forums:', forumExperiences.length);
      console.log('   Chats:', chatExperiences.length);
      console.log('\n   Forum Experiences:');
      forumExperiences.forEach(e => console.log(`     - ${e.name} (${e.id})`));
      console.log('   Chat Experiences:');
      chatExperiences.forEach(e => console.log(`     - ${e.name} (${e.id})`));
      
    } catch (error) {
      results.steps.push({
        step: 4,
        name: 'List All Experiences',
        success: false,
        error: error.message
      });
      throw new Error(`Step 4 Failed: ${error.message}`);
    }

    // ===================================================================
    // STEP 5: Fetch sample forum posts (if available)
    // ===================================================================
    console.log('\n📍 STEP 5: Fetching sample forum posts...');
    
    const experiences = allExperiences?.experiencesV2?.nodes || [];
    const forumExperiences = experiences.filter(e => 
      e.type === 'forum' || e.name?.toLowerCase().includes('forum')
    );
    
    if (forumExperiences.length > 0) {
      const firstForum = forumExperiences[0];
      console.log('   Testing forum:', firstForum.name, `(${firstForum.id})`);
      
      try {
        // Using EXACT Whop SDK method from official docs
        // Parameter is 'experienceId' not 'forumId'
        const forumPosts = await whopSdk.forums.listForumPostsFromForum({
          experienceId: firstForum.id  // EXACT parameter name from docs
        });
        
        const posts = forumPosts?.posts || [];  // EXACT response structure from docs
        
        results.steps.push({
          step: 5,
          name: 'Fetch Forum Posts',
          success: true,
          data: {
            forumId: firstForum.id,
            forumName: firstForum.name,
            postCount: posts.length,
            samplePosts: posts.slice(0, 5).map(p => ({
              id: p.id,
              authorId: p.user?.id,
              authorName: p.user?.name,
              authorUsername: p.user?.username,
              content: p.content?.substring(0, 100),
              viewCount: p.viewCount,
              isPinned: p.isPinned,
              createdAt: p.createdAt
            }))
          },
          notes: [
            `Retrieved ${posts.length} posts from forum`,
            'User data structure: user.id, user.name, user.username',
            'Engagement metrics: viewCount, isPinned'
          ]
        });
        
        console.log('✅ Forum posts retrieved');
        console.log('   Posts fetched:', posts.length);
        if (posts.length > 0) {
          console.log('   Sample post structure:');
          console.log('     - Author ID:', posts[0].user?.id);
          console.log('     - Author Name:', posts[0].user?.name);
          console.log('     - Author Username:', posts[0].user?.username);
          console.log('     - View Count:', posts[0].viewCount);
          console.log('     - Is Pinned:', posts[0].isPinned);
        }
        
      } catch (error) {
        results.steps.push({
          step: 5,
          name: 'Fetch Forum Posts',
          success: false,
          error: error.message,
          notes: ['This may require specific API permissions']
        });
        console.log('⚠️  Could not fetch forum posts:', error.message);
      }
    } else {
      results.steps.push({
        step: 5,
        name: 'Fetch Forum Posts',
        success: false,
        error: 'No forum experiences found in community'
      });
      console.log('⚠️  No forums found to test');
    }

    // ===================================================================
    // STEP 6: Fetch sample chat messages (if available)
    // ===================================================================
    console.log('\n📍 STEP 6: Fetching sample chat messages...');
    
    const chatExperiences = experiences.filter(e => 
      e.type === 'chat' || e.name?.toLowerCase().includes('chat')
    );
    
    if (chatExperiences.length > 0) {
      const firstChat = chatExperiences[0];
      console.log('   Testing chat:', firstChat.name, `(${firstChat.id})`);
      
      try {
        const chatMessages = await whopSdk.messages.listMessagesFromChat({
          chatExperienceId: firstChat.id,
          first: 5  // Get 5 messages as sample
        });
        
        const messages = chatMessages?.nodes || [];
        
        results.steps.push({
          step: 6,
          name: 'Fetch Chat Messages',
          success: true,
          data: {
            chatId: firstChat.id,
            chatName: firstChat.name,
            messageCount: messages.length,
            sampleMessages: messages.map(m => ({
              id: m.id,
              authorId: m.author?.id,
              authorName: m.author?.name,
              content: m.content?.substring(0, 100),
              createdAt: m.createdAt
            }))
          },
          notes: [
            `Retrieved ${messages.length} messages from chat`,
            'User data structure confirmed'
          ]
        });
        
        console.log('✅ Chat messages retrieved');
        console.log('   Messages fetched:', messages.length);
        if (messages.length > 0) {
          console.log('   Sample message structure:');
          console.log('     - Author ID:', messages[0].author?.id);
          console.log('     - Author Name:', messages[0].author?.name);
        }
        
      } catch (error) {
        results.steps.push({
          step: 6,
          name: 'Fetch Chat Messages',
          success: false,
          error: error.message,
          notes: ['This may require specific API permissions']
        });
        console.log('⚠️  Could not fetch chat messages:', error.message);
      }
    } else {
      results.steps.push({
        step: 6,
        name: 'Fetch Chat Messages',
        success: false,
        error: 'No chat experiences found in community'
      });
      console.log('⚠️  No chats found to test');
    }

    // ===================================================================
    // FINAL SUMMARY
    // ===================================================================
    console.log('\n═══════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════');
    console.log('✅ Company Identified:', results.summary.companyId);
    console.log('✅ Total Experiences:', results.summary.totalExperiences);
    console.log('✅ Forums Found:', results.summary.forumCount);
    console.log('✅ Chats Found:', results.summary.chatCount);
    
    const successfulSteps = results.steps.filter(s => s.success).length;
    const totalSteps = results.steps.length;
    console.log(`\n✅ Completed ${successfulSteps}/${totalSteps} steps successfully`);
    console.log('═══════════════════════════════════════════════\n');

    return NextResponse.json({
      success: true,
      message: `Flow test completed: ${successfulSteps}/${totalSteps} steps successful`,
      results: results,
      implementationReady: successfulSteps >= 4,  // Need at least steps 1-4 to work
      nextSteps: [
        'Review the data structures returned',
        'Confirm forum/chat identification logic',
        'Test point calculation from engagement data',
        'Implement database storage for tracked data'
      ]
    });

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      errorStack: error.stack,
      results: results,
      partialResults: results.steps.length > 0,
    }, { status: 500 });
  }
}
