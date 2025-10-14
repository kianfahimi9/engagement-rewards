/**
 * Whop Payment Webhook Handler
 * Validates and processes payment events
 */

import { NextResponse } from 'next/server';
import { makeWebhookValidator } from "@whop/api";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET || 'temp_secret',
});

export async function POST(request) {
  try {
    console.log('\n🔔 Webhook received');

    // Validate the webhook to ensure it's from Whop
    const webhook = await validateWebhook(request);

    console.log('Webhook action:', webhook.action);

    // Handle different webhook events
    if (webhook.action === "payment.succeeded") {
      await handlePaymentSucceeded(webhook.data);
    } else if (webhook.action === "payment.failed") {
      await handlePaymentFailed(webhook.data);
    } else {
      console.log(`ℹ️ Unhandled webhook action: ${webhook.action}`);
    }

    // IMPORTANT: Return 2xx quickly to acknowledge receipt
    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    // Still return 200 to prevent retries
    return new Response("OK", { status: 200 });
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(data) {
  console.log('✅ Payment succeeded:', {
    id: data.id,
    user_id: data.user_id,
    amount: data.amount,
    metadata: data.metadata,
  });

  const { metadata } = data;

  // Check if this is a prize pool creation
  if (metadata?.type === 'prize_pool_creation') {
    const { communityId } = metadata;

    // Update prize pool status to active
    const { error } = await supabase
      .from('prize_pools')
      .update({
        status: 'active',
        whop_payment_id: data.id,
        updated_at: new Date(),
      })
      .eq('whop_charge_id', data.id);

    if (error) {
      console.error('Database update error:', error);
    } else {
      console.log('✅ Prize pool activated');
    }
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(data) {
  console.log('❌ Payment failed:', {
    id: data.id,
    user_id: data.user_id,
    metadata: data.metadata,
  });

  const { metadata } = data;

  // Check if this is a prize pool creation
  if (metadata?.type === 'prize_pool_creation') {
    // Update prize pool status to failed
    const { error } = await supabase
      .from('prize_pools')
      .update({
        status: 'failed',
        updated_at: new Date(),
      })
      .eq('whop_charge_id', data.id);

    if (error) {
      console.error('Database update error:', error);
    } else {
      console.log('✅ Prize pool marked as failed');
    }
  }
}
