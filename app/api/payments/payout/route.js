/**
 * Payout Winners
 * Transfer funds from company ledger to winners
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
    const { prizePoolId, winners } = body;

    if (!prizePoolId || !winners || !Array.isArray(winners)) {
      return NextResponse.json(
        { error: 'Missing required fields: prizePoolId, winners (array)' },
        { status: 400 }
      );
    }

    console.log(`\n💰 Starting payouts for prize pool: ${prizePoolId}`);

    // Get prize pool details
    const { data: prizePool, error: poolError } = await supabase
      .from('prize_pools')
      .select('*')
      .eq('id', prizePoolId)
      .single();

    if (poolError || !prizePool) {
      throw new Error('Prize pool not found');
    }

    if (prizePool.status !== 'active') {
      throw new Error(`Prize pool status is ${prizePool.status}, must be active`);
    }

    // Get company ledger account
    const ledgerAccount = await whopSdk.companies.getCompanyLedgerAccount({
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
    });

    if (!ledgerAccount?.company?.ledgerAccount) {
      throw new Error('Company ledger account not found');
    }

    const ledgerAccountId = ledgerAccount.company.ledgerAccount.id;
    const transferFee = ledgerAccount.company.ledgerAccount.transferFee;

    console.log('Company ledger:', {
      balance: ledgerAccount.company.ledgerAccount.balance,
      ledgerAccountId,
      transferFee,
    });

    const payoutResults = [];

    // Process each winner
    for (const winner of winners) {
      try {
        const { userId, whopUserId, username, amount, rank } = winner;

        if (!amount || amount <= 0) {
          console.log(`⚠️ Skipping ${username} - invalid amount: ${amount}`);
          continue;
        }

        const amountInCents = Math.round(parseFloat(amount) * 100);

        console.log(`\n💸 Paying ${username} (rank #${rank}): $${amount}`);

        // Pay the user via Whop
        const payoutResponse = await whopSdk.payments.payUser({
          amount: amountInCents,
          currency: "usd",
          destinationId: whopUserId || username, // Can use username or whop user ID
          ledgerAccountId: ledgerAccountId,
          transferFee: transferFee,
        });

        console.log(`✅ Payout successful for ${username}`);

        // Record payout in database
        const { data: payout, error: payoutError } = await supabase
          .from('payouts')
          .insert({
            prize_pool_id: prizePoolId,
            user_id: userId,
            community_id: prizePool.community_id,
            amount: parseFloat(amount),
            rank: rank,
            status: 'completed',
            whop_payment_id: payoutResponse.__typename, // Adjust based on actual response
            paid_at: new Date(),
          })
          .select()
          .single();

        if (payoutError) {
          console.error(`Database error for ${username}:`, payoutError);
        }

        payoutResults.push({
          username,
          rank,
          amount,
          status: 'success',
          payoutId: payout?.id,
        });

      } catch (error) {
        console.error(`❌ Payout failed for ${winner.username}:`, error);
        payoutResults.push({
          username: winner.username,
          rank: winner.rank,
          amount: winner.amount,
          status: 'failed',
          error: error.message,
        });
      }
    }

    // Update prize pool status
    await supabase
      .from('prize_pools')
      .update({
        status: 'completed',
        updated_at: new Date(),
      })
      .eq('id', prizePoolId);

    console.log(`\n✅ Payouts complete for prize pool: ${prizePoolId}`);

    return NextResponse.json({
      success: true,
      message: 'Payouts processed',
      results: payoutResults,
    });

  } catch (error) {
    console.error('❌ Error processing payouts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process payouts',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
