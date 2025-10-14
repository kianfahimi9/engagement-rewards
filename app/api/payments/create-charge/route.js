/**
 * Create Prize Pool Charge
 * Step 1: Create a charge on the server that will be confirmed in the client modal
 */

import { NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, amount, communityId, periodStart, periodEnd, title } = body;

    if (!userId || !amount || !communityId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, communityId' },
        { status: 400 }
      );
    }

    // Convert amount to cents (Whop expects cents)
    const amountInCents = Math.round(parseFloat(amount) * 100);

    console.log('Creating prize pool charge:', {
      userId,
      amount: amountInCents,
      communityId,
    });

    // Create charge using Whop SDK
    const result = await whopSdk.payments.chargeUser({
      amount: amountInCents,
      currency: "usd",
      userId: userId,
      metadata: {
        type: 'prize_pool_creation',
        communityId: communityId,
        periodStart: periodStart,
        periodEnd: periodEnd,
        title: title || 'Prize Pool',
      },
    });

    if (!result?.inAppPurchase) {
      throw new Error("Failed to create charge - no inAppPurchase returned");
    }

    console.log('✅ Charge created successfully:', result.inAppPurchase.id);

    // Create pending prize pool in database
    const { data: prizePool, error: dbError } = await supabase
      .from('prize_pools')
      .insert({
        community_id: communityId,
        amount: parseFloat(amount),
        currency: 'USD',
        period_start: periodStart,
        period_end: periodEnd,
        status: 'pending', // Will be updated to 'active' via webhook
        whop_charge_id: result.inAppPurchase.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to create prize pool in database');
    }

    return NextResponse.json({
      success: true,
      inAppPurchase: result.inAppPurchase,
      prizePoolId: prizePool.id,
    });

  } catch (error) {
    console.error('❌ Error creating charge:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create prize pool charge',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
