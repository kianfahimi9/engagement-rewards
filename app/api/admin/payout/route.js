/**
 * Admin Payout API
 * POST = Manual test payout (single user)
 * PUT = Automatic distribution to top 10
 */

import { NextResponse } from 'next/server';
import { whopSdk, whopApiClient } from '@/lib/whop-sdk';
import { supabase } from '@/lib/supabase';

// POST /api/admin/payout - Manual test payout to single user
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, username, amount, companyId, experienceId, prizePoolId } = body;

    if (!userId || !amount || !companyId || !experienceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('🎁 Manual test payout:', { userId, username, amount });

    // Get company ledger account - following exact Whop documentation
    // https://docs.whop.com/apps/features/payments-and-payouts
    const experience = await whopSdk.experiences.retrieve(experienceId);
    const ledgerAccount = await whopSdk.companies.getCompanyLedgerAccount({
      companyId: experience.company.id,
    });

    const ledgerAccountId = ledgerAccount.company?.ledgerAccount?.id;
    const transferFee = ledgerAccount.company?.ledgerAccount?.transferFee;

    if (!ledgerAccountId) {
      throw new Error('Company ledger account not found');
    }

    // Pay user following exact Whop documentation
    const payoutResult = await whopSdk.payments.payUser({
      amount: parseFloat(amount),
      currency: "usd",
      destinationId: userId,
      ledgerAccountId: ledgerAccountId,
      transferFee: transferFee,
      idempotenceKey: `manual-${userId}-${Date.now()}`,
      notes: `Manual test payout`,
      reason: "content_reward_payout"
    });

    console.log('✅ Test payout successful');

    // Record in database
    const { data: payout } = await supabase
      .from('payouts')
      .insert({
        whop_payout_id: payoutResult.id || `test_${Date.now()}`,
        whop_payment_id: prizePoolId || 'manual_test',
        whop_user_id: userId,
        whop_company_id: companyId,
        amount: parseFloat(amount),
        rank: 0,
        status: 'completed',
        points_earned: 0,
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      message: `Paid $${amount} to ${username || userId}`,
      payout: payoutResult,
      record: payout
    });

  } catch (error) {
    console.error('❌ Manual payout error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/payout - Automatic distribution to top 10
export async function PUT(request) {
  try {
    const body = await request.json();
    const { prizePoolId, companyId, experienceId } = body;

    if (!prizePoolId || !companyId || !experienceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('🏆 Auto-distributing prize pool:', prizePoolId);

    // Get prize pool
    const { data: prizePool } = await supabase
      .from('prize_pools')
      .select('*')
      .eq('whop_payment_id', prizePoolId)
      .single();

    if (!prizePool) {
      throw new Error('Prize pool not found');
    }

    if (prizePool.status === 'paid_out') {
      throw new Error('Already paid out');
    }

    // Get top 10 from leaderboard
    const { data: winners } = await supabase
      .from('leaderboard_entries')
      .select('whop_user_id, points, rank, users(username)')
      .eq('whop_company_id', companyId)
      .eq('period_type', prizePool.period_type)
      .gte('period_start', prizePool.period_start)
      .lte('period_start', prizePool.period_end)
      .order('points', { ascending: false })
      .limit(10);

    if (!winners || winners.length === 0) {
      throw new Error('No winners found');
    }

    // Get ledger account - following exact Whop documentation
    // https://docs.whop.com/apps/features/payments-and-payouts
    const experience = await whopSdk.experiences.retrieve(experienceId);
    const ledgerAccount = await whopSdk.companies.getCompanyLedgerAccount({
      companyId: experience.company.id,
    });

    const ledgerAccountId = ledgerAccount.company?.ledgerAccount?.id;
    const transferFee = ledgerAccount.company?.ledgerAccount?.transferFee;

    // Validate ledger account
    if (!ledgerAccountId) {
      console.error('Ledger account response:', JSON.stringify(ledgerAccount, null, 2));
      throw new Error('Company ledger account not found. Please ensure the company has a ledger account set up.');
    }

    console.log(`✅ Ledger account found: ${ledgerAccountId}`);

    // Proportional distribution - ensures FULL prize pool is distributed
    // Maintains relative ratios from original fixed percentages [40, 18, 12, 8, 6, 5, 4, 3, 2, 2]
    const calculateProportionalPercentages = (numWinners) => {
      if (numWinners === 1) return [100];
      if (numWinners === 2) return [69.23, 30.77]; // Maintains ~2.25x ratio (40:18)
      if (numWinners === 3) return [54.55, 25.00, 20.45]; // Maintains ratios (40:18:12)
      
      // For 4+ winners, use original fixed percentages as weights
      // Then normalize to 100% to ensure full distribution
      const fixedPercentages = [40, 18, 12, 8, 6, 5, 4, 3, 2, 2];
      const weights = fixedPercentages.slice(0, numWinners);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      
      // Normalize to 100%
      return weights.map(w => (w / totalWeight) * 100);
    };

    const percentages = calculateProportionalPercentages(winners.length);
    const payouts = [];
    const errors = [];

    console.log(`📊 Distributing to ${winners.length} winners with proportions:`, 
      percentages.map((p, i) => `${i+1}: ${p.toFixed(1)}%`));

    for (let i = 0; i < winners.length && i < 10; i++) {
      const winner = winners[i];
      const amount = (prizePool.amount * percentages[i]) / 100;

      try {
        // Pay user following exact Whop documentation
        // https://docs.whop.com/apps/features/payments-and-payouts
        const payoutResult = await whopSdk.payments.payUser({
          amount: amount,
          currency: "usd",
          destinationId: winner.whop_user_id,
          ledgerAccountId: ledgerAccountId,
          transferFee: transferFee,
          idempotenceKey: `${prizePoolId}-${winner.whop_user_id}-${i}`,
          notes: `Prize #${i + 1} - ${prizePool.period_type}`,
          reason: "content_reward_payout"
        });

        const { data: payout } = await supabase
          .from('payouts')
          .insert({
            whop_payout_id: payoutResult.id || `auto_${Date.now()}_${i}`,
            whop_payment_id: prizePoolId,
            whop_user_id: winner.whop_user_id,
            whop_company_id: companyId,
            amount: amount,
            rank: i + 1,
            status: 'completed',
            points_earned: winner.points,
          })
          .select()
          .single();

        payouts.push(payout);
        console.log(`✅ Rank ${i + 1}: $${amount.toFixed(2)} to ${winner.users?.username}`);

      } catch (error) {
        console.error(`❌ Rank ${i + 1} failed:`, error);
        errors.push({ rank: i + 1, error: error.message });
      }
    }

    // Update prize pool status - only if at least one payout succeeded
    if (payouts.length > 0) {
      await supabase
        .from('prize_pools')
        .update({
          status: 'paid_out',
          paid_out_at: new Date().toISOString(),
          winners_count: payouts.length,
        })
        .eq('whop_payment_id', prizePoolId);
    } else {
      // All payouts failed - mark as failed
      await supabase
        .from('prize_pools')
        .update({
          status: 'failed',
        })
        .eq('whop_payment_id', prizePoolId);
    }

    return NextResponse.json({
      success: payouts.length > 0,
      message: payouts.length > 0 
        ? `Distributed to ${payouts.length} winners` 
        : 'All payouts failed',
      payouts,
      errors,
      totalPaid: payouts.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    });

  } catch (error) {
    console.error('❌ Auto-distribution error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
