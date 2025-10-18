import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyUser } from '@/lib/authentication';
import { getCompanyBalance, distributePrizePool } from '@/lib/whop-payments';

// GET /api/admin/prize-pools - List all prize pools
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const experienceId = searchParams.get('experienceId');
    const companyId = searchParams.get('companyId');
    const userId = searchParams.get('userId');

    // Verify user is admin
    const authResult = await verifyUser(userId, experienceId);
    if (!authResult.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    // Fetch prize pools
    const { data: prizePools, error } = await supabase
      .from('prize_pools')
      .select('*')
      .eq('whop_company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get company balance
    const balance = await getCompanyBalance(companyId);

    return NextResponse.json({
      success: true,
      prizePools: prizePools || [],
      companyBalance: balance
    });
  } catch (error) {
    console.error('Error fetching prize pools:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/prize-pools - Create new prize pool
export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, periodType, endDate, experienceId, companyId, userId } = body;

    // Verify user is admin
    const authResult = await verifyUser(userId, experienceId);
    if (!authResult.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!['weekly', 'monthly', 'all_time'].includes(periodType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid period type' },
        { status: 400 }
      );
    }

    // Parse start and end dates
    const startDate = new Date(body.startDate || Date.now());
    const poolEndDate = new Date(endDate);

    // Validate dates
    if (poolEndDate <= startDate) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check for overlapping prize pools (Option A: Strict - only ONE active pool at a time)
    const { data: existingPools, error: checkError } = await supabase
      .from('prize_pools')
      .select('id, period_type, start_date, end_date, status, amount')
      .eq('whop_company_id', companyId)
      .in('status', ['pending', 'active'])
      .order('start_date', { ascending: true });

    if (checkError) throw checkError;

    // Check if any existing pool overlaps with the new pool's date range
    if (existingPools && existingPools.length > 0) {
      for (const pool of existingPools) {
        const existingStart = new Date(pool.start_date);
        const existingEnd = new Date(pool.end_date);

        // Check for any overlap
        const hasOverlap = 
          (startDate >= existingStart && startDate < existingEnd) || // New starts during existing
          (poolEndDate > existingStart && poolEndDate <= existingEnd) || // New ends during existing
          (startDate <= existingStart && poolEndDate >= existingEnd); // New encompasses existing

        if (hasOverlap) {
          return NextResponse.json({
            success: false,
            error: `Prize pool overlaps with existing ${pool.period_type} pool ($${pool.amount})`,
            details: {
              existingPool: {
                period: pool.period_type,
                start: pool.start_date,
                end: pool.end_date,
                amount: pool.amount
              },
              suggestion: `Schedule your pool to start after ${new Date(existingEnd).toLocaleDateString()}`
            }
          }, { status: 409 }); // 409 Conflict
        }
      }
    }

    // Check company balance
    const balance = await getCompanyBalance(companyId);
    
    if (balance.availableBalance < amount) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient balance',
        needsPayment: true,
        currentBalance: balance.availableBalance,
        required: amount
      }, { status: 402 }); // 402 Payment Required
    }

    // Create prize pool
    const { data: prizePool, error } = await supabase
      .from('prize_pools')
      .insert({
        whop_company_id: companyId,
        amount: amount,
        period_type: periodType,
        start_date: startDate.toISOString(),
        end_date: poolEndDate.toISOString(),
        status: 'pending', // Will become 'active' when payment succeeds
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      prizePool
    });
  } catch (error) {
    console.error('Error creating prize pool:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/prize-pools - Edit prize pool (with restrictions)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { prizePoolId, title, amount, periodType, startDate, endDate, experienceId, userId } = body;

    // Verify user is admin
    const authResult = await verifyUser(userId, experienceId);
    if (!authResult.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    // Get current prize pool
    const { data: currentPool, error: fetchError } = await supabase
      .from('prize_pools')
      .select('*')
      .eq('id', prizePoolId)
      .single();

    if (fetchError || !currentPool) {
      return NextResponse.json(
        { success: false, error: 'Prize pool not found' },
        { status: 404 }
      );
    }

    // Simple edit policy:
    // - Pending (status = 'pending'): Can edit everything
    // - Active/Ended/Paid out: Lock amount & dates, only allow title edits
    
    const isPending = currentPool.status === 'pending';
    const isEditable = isPending;

    const updates = {};

    // Title can always be edited
    if (title !== undefined) {
      updates.title = title;
    }

    // Amount, dates, period can only be edited if pending
    if (isEditable) {
      if (amount !== undefined) updates.amount = amount;
      if (periodType !== undefined) updates.period_type = periodType;
      if (startDate !== undefined) updates.start_date = new Date(startDate).toISOString();
      if (endDate !== undefined) updates.end_date = new Date(endDate).toISOString();
    } else {
      // If trying to edit locked fields, return error
      if (amount !== undefined || periodType !== undefined || startDate !== undefined || endDate !== undefined) {
        return NextResponse.json({
          success: false,
          error: 'Cannot edit amount or dates after payment',
          lockedFields: ['amount', 'periodType', 'startDate', 'endDate'],
          reason: 'Prize pool is already active or completed'
        }, { status: 403 });
      }
    }

    // Update prize pool
    const { data: updatedPool, error: updateError } = await supabase
      .from('prize_pools')
      .update(updates)
      .eq('id', prizePoolId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      prizePool: updatedPool,
      message: isEditable ? 'Prize pool updated' : 'Title updated (other fields locked)'
    });
  } catch (error) {
    console.error('Error updating prize pool:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/prize-pools - Delete prize pool (only if pending)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const prizePoolId = searchParams.get('prizePoolId');
    const userId = searchParams.get('userId');
    const experienceId = searchParams.get('experienceId');

    // Verify user is admin
    const authResult = await verifyUser(userId, experienceId);
    if (!authResult.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    // Get prize pool
    const { data: pool, error: fetchError } = await supabase
      .from('prize_pools')
      .select('*')
      .eq('id', prizePoolId)
      .single();

    if (fetchError || !pool) {
      return NextResponse.json(
        { success: false, error: 'Prize pool not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending pools
    if (pool.status !== 'pending') {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete active or completed prize pools',
        status: pool.status
      }, { status: 403 });
    }

    // Delete prize pool
    const { error: deleteError } = await supabase
      .from('prize_pools')
      .delete()
      .eq('id', prizePoolId);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: 'Prize pool deleted'
    });
  } catch (error) {
    console.error('Error deleting prize pool:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
