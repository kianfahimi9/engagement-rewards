/**
 * Whop Payment Webhook Handler
 * Validates and processes payment events
 */

import { NextResponse } from 'next/server';
import { makeWebhookValidator } from "@whop/api";
import { supabase } from '@/lib/supabase';

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
 * Updated for 2025 Whop API - checkout configurations
 */
async function handlePaymentSucceeded(data) {
  console.log('✅ Payment succeeded:', {
    id: data.id,
    user_id: data.user_id,
    amount: data.amount,
    checkout_session_id: data.checkout_session_id,
    metadata: data.metadata,
  });

  const { metadata } = data;

  // Check if this is a prize pool deposit (new metadata type)
  if (metadata?.type === 'prize_pool_deposit' || metadata?.type === 'prize_pool_creation') {
    const { companyId, experienceId } = metadata;

    console.log('💰 Prize pool payment detected:', { companyId, experienceId });

    // According to Whop docs, the payment webhook includes plan_id in metadata
    // We can match by plan_id, checkout_id, or even metadata fields
    const planId = metadata.plan_id || data.plan_id;
    const checkoutId = data.checkout_session_id || metadata.checkout_session_id;
    
    console.log('🔍 Matching prize pool:', { planId, checkoutId, companyId });

    // Try to find prize pool by plan_id (most reliable), then checkout_id, then by metadata match
    let prizePool = null;
    let fetchError = null;

    // Strategy 1: Match by plan_id (most reliable with checkout configurations)
    if (planId) {
      const result = await supabase
        .from('prize_pools')
        .select('*')
        .eq('whop_plan_id', planId)
        .maybeSingle();
      prizePool = result.data;
      fetchError = result.error;
    }

    // Strategy 2: Fallback to checkout_id
    if (!prizePool && checkoutId) {
      const result = await supabase
        .from('prize_pools')
        .select('*')
        .eq('whop_checkout_id', checkoutId)
        .maybeSingle();
      prizePool = result.data;
      fetchError = result.error;
    }

    // Strategy 3: Last resort - match by amount + company + recent creation (last 5 minutes)
    if (!prizePool && metadata.amount && companyId) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const result = await supabase
        .from('prize_pools')
        .select('*')
        .eq('whop_company_id', companyId)
        .eq('amount', metadata.amount)
        .eq('status', 'pending')
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      prizePool = result.data;
      fetchError = result.error;
    }

    if (fetchError) {
      console.error('❌ Error finding prize pool:', fetchError);
      return;
    }

    if (!prizePool) {
      console.warn('⚠️ No prize pool found for checkout session:', data.checkout_session_id);
      return;
    }

    // Update prize pool status to active
    const { error: updateError } = await supabase
      .from('prize_pools')
      .update({
        status: 'active',
        whop_payment_id: data.id,
        updated_at: new Date().toISOString(),
      })
      .eq('whop_checkout_id', prizePool.whop_checkout_id);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
    } else {
      console.log('✅ Prize pool activated:', prizePool.id);
    }
  }
}

/**
 * Handle failed payment
 * Updated for 2025 Whop API
 */
async function handlePaymentFailed(data) {
  console.log('❌ Payment failed:', {
    id: data.id,
    user_id: data.user_id,
    checkout_session_id: data.checkout_session_id,
    metadata: data.metadata,
  });

  const { metadata } = data;

  // Check if this is a prize pool deposit
  if (metadata?.type === 'prize_pool_deposit' || metadata?.type === 'prize_pool_creation') {
    // Find and update prize pool status to failed
    const { data: prizePool, error: fetchError } = await supabase
      .from('prize_pools')
      .select('*')
      .eq('whop_checkout_id', data.checkout_session_id || data.id)
      .maybeSingle();

    if (fetchError || !prizePool) {
      console.error('❌ Error finding prize pool:', fetchError);
      return;
    }

    const { error: updateError } = await supabase
      .from('prize_pools')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('whop_checkout_id', prizePool.whop_checkout_id);

    if (updateError) {
      console.error('❌ Database update error:', updateError);
    } else {
      console.log('✅ Prize pool marked as failed');
    }
  }
}
