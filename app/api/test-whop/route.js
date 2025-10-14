/**
 * Whop API Testing Endpoint
 * 
 * This endpoint lets us test various Whop SDK methods
 * and see what raw data they return
 */

import { NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('test') || 'list';
  const experienceId = searchParams.get('experienceId') || '';
  
  console.log(`\n🧪 Testing Whop API: ${testType}`);
  console.log(`Experience ID: ${experienceId || 'Not provided'}`);
  
  try {
    let result = null;
    let testDescription = '';

    switch (testType) {
      // Test 1: List all experiences (to find chat/forum IDs)
      case 'experiences':
        testDescription = 'List all experiences (chat, forums, etc.)';
        try {
          result = await whopSdk.companies.listExperiences({
            companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
          });
        } catch (error) {
          result = { error: error.message, stack: error.stack };
        }
        break;

      // Test 2: List messages from chat
      case 'chat-messages':
        testDescription = 'List messages from chat';
        if (!experienceId) {
          return NextResponse.json({
            error: 'experienceId parameter is required. Use ?test=chat-messages&experienceId=exp_XXX'
          }, { status: 400 });
        }
        try {
          result = await whopSdk.messages.listMessagesFromChat({
            chatExperienceId: experienceId,
          });
        } catch (error) {
          result = { error: error.message, stack: error.stack };
        }
        break;

      // Test 3: List forum posts
      case 'forum-posts':
        testDescription = 'List forum posts';
        if (!experienceId) {
          return NextResponse.json({
            error: 'experienceId parameter is required. Use ?test=forum-posts&experienceId=exp_XXX'
          }, { status: 400 });
        }
        try {
          result = await whopSdk.forums.listForumPostsFromForum({
            experienceId: experienceId,
          });
        } catch (error) {
          result = { error: error.message, stack: error.stack };
        }
        break;

      // Test 4: Get current user info
      case 'current-user':
        testDescription = 'Get current authenticated user';
        try {
          result = await whopSdk.users.getCurrentUser();
        } catch (error) {
          result = { error: error.message, stack: error.stack };
        }
        break;

      // Test 5: List company members
      case 'members':
        testDescription = 'List all company members';
        try {
          result = await whopSdk.companies.listMembers({
            companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
          });
        } catch (error) {
          result = { error: error.message, stack: error.stack };
        }
        break;

      // Test 6: List all available webhooks
      case 'webhooks':
        testDescription = 'List all webhooks configured';
        try {
          result = await whopSdk.webhooks.listWebhooks({
            companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
          });
        } catch (error) {
          result = { error: error.message, stack: error.stack };
        }
        break;

      // Test 7: Explore SDK methods
      case 'sdk-methods':
        testDescription = 'Explore available SDK methods';
        result = {
          availableMethods: {
            users: Object.keys(whopSdk.users || {}),
            companies: Object.keys(whopSdk.companies || {}),
            messages: Object.keys(whopSdk.messages || {}),
            forums: Object.keys(whopSdk.forums || {}),
            webhooks: Object.keys(whopSdk.webhooks || {}),
            memberships: Object.keys(whopSdk.memberships || {}),
          }
        };
        break;

      // Default: List all available tests
      default:
        return NextResponse.json({
          message: 'Whop API Testing Endpoint',
          availableTests: [
            { test: 'experiences', description: 'List all experiences (chat, forums) - ?test=experiences' },
            { test: 'chat-messages', description: 'List chat messages - ?test=chat-messages&experienceId=exp_XXX' },
            { test: 'forum-posts', description: 'List forum posts - ?test=forum-posts&experienceId=exp_XXX' },
            { test: 'current-user', description: 'Get current user info - ?test=current-user' },
            { test: 'members', description: 'List company members - ?test=members' },
            { test: 'webhooks', description: 'List webhooks - ?test=webhooks' },
            { test: 'sdk-methods', description: 'Explore SDK methods - ?test=sdk-methods' },
          ],
          usage: 'Add ?test={testName} to this URL to run a test',
          config: {
            appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
            companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
            agentUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,
          }
        });
    }

    console.log(`✅ Test "${testDescription}" completed`);
    console.log('Raw result:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      test: testType,
      description: testDescription,
      timestamp: new Date().toISOString(),
      result: result,
      rawResultString: JSON.stringify(result, null, 2),
    });

  } catch (error) {
    console.error(`❌ Test failed:`, error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
      test: testType,
    }, { status: 500 });
  }
}

// Test webhook creation
export async function POST(request) {
  console.log('\n🧪 Testing Webhook Creation');
  
  try {
    const body = await request.json();
    const { webhookUrl, events } = body;

    if (!webhookUrl) {
      return NextResponse.json({
        error: 'webhookUrl is required in request body'
      }, { status: 400 });
    }

    // Try to create a webhook
    const result = await whopSdk.webhooks.createWebhook({
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      url: webhookUrl,
      events: events || ['payment_succeeded'], // Default to payment events
      enabled: true,
    });

    console.log('✅ Webhook created:', result);

    return NextResponse.json({
      success: true,
      message: 'Webhook created successfully',
      webhook: result,
    });

  } catch (error) {
    console.error('❌ Webhook creation failed:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
