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
 * Following official Whop documentation exactly
 */
async function handlePaymentSucceeded(data) {
  console.log('✅ Payment succeeded:', {
    id: data.id,
    user_id: data.user_id,
    subtotal: data.subtotal,
    amount_after_fees: data.amount_after_fees,
    metadata: data.metadata,
  });

  const { id, user_id, metadata } = data;

  // Check if this is a prize pool deposit
  if (metadata?.type === 'prize_pool_deposit') {
    const { companyId, experienceId, periodStart, periodEnd, periodType, amount } = metadata;

    console.log('💰 Prize pool payment detected:', {
      paymentId: id,
      userId: user_id,
      companyId,
      amount
    });

    // Create prize pool record (official pattern - create on webhook, not before)
    const { data: prizePool, error: insertError } = await supabase
      .from('prize_pools')
      .insert({
        whop_payment_id: id,
        whop_company_id: companyId,
        whop_user_id: user_id,
        amount: parseFloat(amount),
        currency: 'usd',
        period_type: periodType || 'weekly',
        period_start: periodStart || null,
        period_end: periodEnd || null,
        status: 'active', // Active immediately since payment succeeded
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
    } else {
      console.log('✅ Prize pool created and activated:', prizePool.whop_payment_id);
    }
  }
}

/**
 * Handle failed payment
 * Following official Whop documentation
 */
async function handlePaymentFailed(data) {
  console.log('❌ Payment failed:', {
    id: data.id,
    user_id: data.user_id,
    metadata: data.metadata,
  });

  // For prize pools, we don't create a record on failure
  // Just log it for debugging
  if (data.metadata?.type === 'prize_pool_deposit') {
    console.log('💸 Prize pool payment failed - no record created');
  }
}
