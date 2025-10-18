/**
 * Whop Payments Integration
 * Handle ledger accounts, transfers, and prize pool distributions
 */

import { whopSdk } from './whop-sdk.js';
import { supabase } from './supabase.js';

/**
 * Get OUR APP's ledger account balance
 * According to latest Whop API (2025), we should retrieve OUR app's ledger account
 * to see the total funds available across all communities
 * @returns {Promise<{balance: number, currency: string}>}
 */
export async function getAppLedgerBalance() {
  try {
    console.log(`💰 Fetching app ledger balance`);
    
    // Get the current app's user (owner of the app)
    const currentUser = await whopSdk.users.getUser();
    const appOwnerId = currentUser.id;
    
    console.log(`👤 App owner: ${appOwnerId}`);
    
    // List ledger accounts to find our app's ledger
    // According to Whop's latest API, we retrieve ledger by ID (ldgr_xxx format)
    // The app owner's primary ledger is where all community payments accumulate
    const ledgerAccountId = `ldgr_${appOwnerId.replace('user_', '')}`;
    
    console.log(`🔍 Retrieving ledger account: ${ledgerAccountId}`);
    
    // Retrieve the ledger account using latest API
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
      reserveBalance: parseFloat(balanceData.reserve_balance || 0),
      ledgerAccountId: ledgerAccount.id
    };
  } catch (error) {
    console.error('❌ Error fetching app ledger balance:', error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    // Return zero balance on error instead of throwing
    return {
      balance: 0,
      availableBalance: 0,
      currency: 'usd',
      pendingBalance: 0,
      reserveBalance: 0,
      ledgerAccountId: null
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
 * Transfers from OUR APP's ledger to community members
 * @param {string} prizePoolId - Prize pool UUID
 * @param {string} companyId - Community company ID (for tracking)
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
    
    // Check OUR APP's balance (not community owner's balance)
    const appBalance = await getAppLedgerBalance();
    if (appBalance.availableBalance < prizePool.amount) {
      throw new Error(`Insufficient app balance. Have: $${appBalance.availableBalance}, Need: $${prizePool.amount}`);
    }
    
    // Distribution percentages for top 10 (total = 100%)
    // 1st: 40%, then decreasing for 2nd-10th
    const distributionPercentages = [40, 18, 12, 8, 6, 5, 4, 3, 2, 2];
    
    const payouts = [];
    const errors = [];
    
    // Get current app user as origin
    const currentUser = await whopSdk.users.getUser();
    const originUserId = currentUser.id;
    
    // Create transfers for each winner
    for (let i = 0; i < winners.length && i < 10; i++) {
      const winner = winners[i];
      const percentage = distributionPercentages[i];
      const payoutAmount = (prizePool.amount * percentage) / 100;
      
      try {
        // Create transfer from OUR APP to winner
        const transfer = await createTransfer(
          originUserId, // Our app's user ID (origin)
          winner.whop_user_id, // Winner's user ID (destination)
          payoutAmount,
          `Prize #${i + 1} - ${prizePool.period_type}`
        );
        
        // Record payout in database
        const { data: payout } = await supabase
          .from('payouts')
          .insert({
            whop_transfer_id: transfer.id,
            whop_checkout_id: prizePoolId,
            whop_user_id: winner.whop_user_id,
            whop_company_id: companyId,
            amount: payoutAmount,
            status: 'completed',
            rank: i + 1,
            points_earned: winner.points
          })
          .select()
          .single();
        
        payouts.push(payout);
        console.log(`✅ Paid rank ${i + 1}: $${payoutAmount.toFixed(2)} to ${winner.users?.username || 'Unknown'}`);
        
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
        paid_out_at: new Date().toISOString(),
        winners_count: payouts.length
      })
      .eq('id', prizePoolId);
    
    return {
      success: payouts.length > 0,
      payouts,
      errors,
      totalPaid: payouts.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    };
    
  } catch (error) {
    console.error('Error distributing prize pool:', error);
    throw error;
  }
}
