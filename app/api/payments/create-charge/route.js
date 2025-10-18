/**
 * Create Prize Pool Checkout Configuration
 * Uses latest Whop API (2025) - checkout configurations
 * Community owner pays to deposit funds into OUR app's ledger
 */

import { NextResponse } from 'next/server';
import { whopSdk } from '@/lib/whop-sdk';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, companyId, experienceId, periodStart, periodEnd, title } = body;

    if (!amount || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, companyId' },
        { status: 400 }
      );
    }

    const amountFloat = parseFloat(amount);

    console.log('Creating prize pool checkout configuration:', {
      amount: amountFloat,
      companyId,
      experienceId
    });

    // Build redirect URL - use experienceId if provided, otherwise companyId
    const redirectExperienceId = experienceId || companyId;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rankwards.preview.emergentagent.com';
    const redirectUrl = `${baseUrl}/admin?experienceId=${redirectExperienceId}&payment=success`;
    
    console.log('Redirect URL:', redirectUrl);

    // Create a checkout configuration using the latest Whop API
    // This creates a one-time payment plan
    const checkoutConfig = await whopSdk.checkoutConfigurations.create({
      plan: {
        company_id: companyId,
        plan_type: 'one_time',
        release_method: 'buy_now',
        currency: 'usd',
        initial_price: amountFloat,
        renewal_price: 0,
        title: title || `Prize Pool - $${amountFloat}`,
        description: 'Deposit funds for community prize pool rewards',
        visibility: 'hidden', // Hidden from public, only accessible via link
      },
      affiliate_code: '', // Required field - empty string if not using affiliates
      metadata: {
        type: 'prize_pool_deposit',
        companyId: companyId,
        experienceId: experienceId,
        periodStart: periodStart,
        periodEnd: periodEnd,
        amount: amountFloat
      },
      redirect_url: redirectUrl
    });

    if (!checkoutConfig?.purchase_url) {
      throw new Error("Failed to create checkout configuration");
    }

    console.log('✅ Checkout configuration created:', checkoutConfig.id);

    // Create pending prize pool in database
    const { data: prizePool, error: dbError } = await supabase
      .from('prize_pools')
      .insert({
        whop_company_id: companyId,
        amount: amountFloat,
        currency: 'usd',
        period_start: periodStart || null,
        period_end: periodEnd || null,
        status: 'pending', // Will be updated to 'active' via webhook when payment completes
        whop_checkout_id: checkoutConfig.id
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to create prize pool in database: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutConfig.purchase_url,
      checkoutConfigId: checkoutConfig.id,
      prizePoolId: prizePool.id,
    });

  } catch (error) {
    console.error('❌ Error creating checkout configuration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create prize pool checkout',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
