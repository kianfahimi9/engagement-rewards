/**
 * Create Prize Pool Charge
 * Following official Whop documentation exactly
 * Uses payments.chargeUser() for in-app purchases
 */

import { NextResponse } from 'next/server';
import { whopApiClient } from '@/lib/whop-sdk';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, userId, companyId, experienceId, periodStart, periodEnd, periodType } = body;

    if (!amount || !userId || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, userId, companyId' },
        { status: 400 }
      );
    }

    const amountFloat = parseFloat(amount);
    const poolPeriodType = periodType || 'weekly';

    console.log('Creating prize pool charge:', {
      amount: amountFloat,
      userId,
      companyId,
      periodType: poolPeriodType
    });

    // Create charge using @whop/api client (has chargeUser method)
    const result = await whopApiClient.payments.chargeUser({
      amount: amountFloat,
      currency: "usd",
      userId: userId,
      metadata: {
        type: 'prize_pool_deposit',
        companyId: companyId,
        experienceId: experienceId,
        periodStart: periodStart,
        periodEnd: periodEnd,
        periodType: poolPeriodType,
        amount: amountFloat
      },
    });

    if (!result?.inAppPurchase) {
      throw new Error("Failed to create charge - no inAppPurchase returned");
    }

    console.log('✅ Charge created:', {
      inAppPurchaseId: result.inAppPurchase.id
    });

    // Note: We DON'T create database record yet
    // It will be created by the webhook when payment succeeds
    // This prevents orphaned pending records

    return NextResponse.json({
      success: true,
      inAppPurchase: result.inAppPurchase
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
