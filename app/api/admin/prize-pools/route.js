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
        end_date: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
        status: 'active',
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
