/**
 * Whop Payments Integration
 * Handle ledger accounts, transfers, and prize pool distributions
 */

import { whopSdk } from './whop-sdk.js';
import { supabase } from './supabase.js';

/**
 * Get company owner's ledger account balance
 * Uses the latest Whop API (2025)
 * @param {string} companyId - Whop company ID (biz_xxx format)
 * @returns {Promise<{balance: number, currency: string}>}
 */
export async function getCompanyBalance(companyId) {
  try {
    console.log(`💰 Fetching balance for company: ${companyId}`);
    
    // Get company details to find owner
    const company = await whopSdk.companies.retrieve(companyId);
    const ownerUserId = company.owner_user.id;
    
    console.log(`👤 Company owner: ${ownerUserId}`);
    
    // Get owner's ledger account - this is where company funds are stored
    // According to Whop's latest API, the ledger account ID format is ldgr_xxx
    // We need to retrieve it via the owner's user ID
    const ledgerAccountId = `ldgr_${ownerUserId.replace('user_', '')}`;
    
    console.log(`🔍 Retrieving ledger account: ${ledgerAccountId}`);
    
    // Retrieve the ledger account
    const ledgerAccount = await whopSdk.ledgerAccounts.retrieve(ledgerAccountId);
    
    // Get USD balance (or first available currency)
    const balances = ledgerAccount.balances || [];
    const usdBalance = balances.find(b => b.currency === 'usd');
    const balanceData = usdBalance || balances[0] || {};
    
    console.log(`✅ Balance retrieved: ${balanceData.balance || 0} ${balanceData.currency || 'usd'}`);
    
    return {
      balance: parseFloat(balanceData.balance || 0),
      availableBalance: parseFloat(balanceData.balance || 0) - parseFloat(balanceData.reserve_balance || 0),
      currency: balanceData.currency || 'usd',
      pendingBalance: parseFloat(balanceData.pending_balance || 0),
      reserveBalance: parseFloat(balanceData.reserve_balance || 0)
    };
  } catch (error) {
    console.error('❌ Error fetching company balance:', error);
    // Return zero balance on error instead of throwing
    return {
      balance: 0,
      availableBalance: 0,
      currency: 'usd',
      pendingBalance: 0,
      reserveBalance: 0
    };
  }
}

/**
 * Create a transfer from company to user
 * @param {string} companyId - Origin (company paying)
 * @param {string} userId - Destination (user receiving)
 * @param {number} amount - Amount to transfer
 * @param {string} notes - Transfer notes
 * @returns {Promise<object>} Transfer result
 */
export async function createTransfer(companyId, userId, amount, notes = '') {
  try {
    console.log(`💸 Creating transfer: ${companyId} → ${userId} ($${amount})`);
    
    const transfer = await whopSdk.transfers.create({
      amount: amount,
      currency: 'usd',
      origin_id: companyId,
      destination_id: userId,
      notes: notes.substring(0, 50), // Max 50 characters
      idempotence_key: `${companyId}-${userId}-${Date.now()}` // Prevent duplicates
    });
    
    console.log(`✅ Transfer created: ${transfer.id}`);
    return transfer;
  } catch (error) {
    console.error('Error creating transfer:', error);
    throw new Error(`Transfer failed: ${error.message}`);
  }
}

/**
 * Distribute prize pool to top 10 leaderboard winners
 * @param {string} prizePoolId - Prize pool UUID
 * @param {string} companyId - Company ID paying out
 * @returns {Promise<{success: boolean, payouts: Array}>}
 */
export async function distributePrizePool(prizePoolId, companyId) {
  try {
    console.log(`🏆 Distributing prize pool: ${prizePoolId}`);
    
    // Get prize pool details
    const { data: prizePool } = await supabase
      .from('prize_pools')
      .select('*')
      .eq('id', prizePoolId)
      .single();
    
    if (!prizePool) {
      throw new Error('Prize pool not found');
    }
    
    if (prizePool.status === 'paid_out') {
      throw new Error('Prize pool already paid out');
    }
    
    // Get top 10 winners from leaderboard for the period
    const { data: winners } = await supabase
      .from('leaderboard_entries')
      .select(`
        whop_user_id,
        points,
        rank,
        users (
          username
        )
      `)
      .eq('whop_company_id', companyId)
      .eq('period_type', prizePool.period_type)
      .order('points', { ascending: false })
      .limit(10);
    
    if (!winners || winners.length === 0) {
      throw new Error('No winners found for this period');
    }
    
    // Check company balance
    const companyBalance = await getCompanyBalance(companyId);
    if (companyBalance.availableBalance < prizePool.amount) {
      throw new Error(`Insufficient balance. Have: $${companyBalance.availableBalance}, Need: $${prizePool.amount}`);
    }
    
    // Distribution percentages for top 10 (total = 100%)
    // 1st: 40%, then decreasing for 2nd-10th
    const distributionPercentages = [40, 18, 12, 8, 6, 5, 4, 3, 2, 2];
    
    const payouts = [];
    const errors = [];
    
    // Create transfers for each winner
    for (let i = 0; i < winners.length && i < 10; i++) {
      const winner = winners[i];
      const percentage = distributionPercentages[i];
      const payoutAmount = (prizePool.amount * percentage) / 100;
      
      try {
        // Create transfer
        const transfer = await createTransfer(
          companyId,
          winner.whop_user_id,
          payoutAmount,
          `Prize Pool #${i + 1} - ${prizePool.period_type}`
        );
        
        // Record payout in database
        const { data: payout } = await supabase
          .from('payouts')
          .insert({
            prize_pool_id: prizePoolId,
            whop_user_id: winner.whop_user_id,
            whop_company_id: companyId,
            amount: payoutAmount,
            status: 'completed',
            whop_transfer_id: transfer.id,
            rank: i + 1,
            points_earned: winner.points
          })
          .select()
          .single();
        
        payouts.push(payout);
        console.log(`✅ Paid rank ${i + 1}: $${payoutAmount} to ${winner.users.username}`);
        
      } catch (transferError) {
        console.error(`❌ Failed to pay rank ${i + 1}:`, transferError);
        errors.push({
          rank: i + 1,
          user: winner.whop_user_id,
          error: transferError.message
        });
      }
    }
    
    // Update prize pool status
    await supabase
      .from('prize_pools')
      .update({
        status: payouts.length > 0 ? 'paid_out' : 'failed',
        paid_out_at: new Date(),
        winners_count: payouts.length
      })
      .eq('id', prizePoolId);
    
    return {
      success: payouts.length > 0,
      payouts,
      errors,
      totalPaid: payouts.reduce((sum, p) => sum + p.amount, 0)
    };
    
  } catch (error) {
    console.error('Error distributing prize pool:', error);
    throw error;
  }
}
