import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/authentication';
import { distributePrizePool } from '@/lib/whop-payments';

// POST /api/admin/payout - Distribute prize pool to winners
export async function POST(request) {
  try {
    const body = await request.json();
    const { prizePoolId, experienceId, companyId, userId } = body;

    console.log('🏆 Payout request:', { prizePoolId, companyId, userId });

    // Verify user is admin
    const authResult = await verifyUser(userId, experienceId);
    if (!authResult.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    // Distribute prize pool
    const result = await distributePrizePool(prizePoolId, companyId);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Payout failed',
        details: result.errors
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully paid out ${result.payouts.length} winners`,
      payouts: result.payouts,
      totalPaid: result.totalPaid,
      errors: result.errors
    });
  } catch (error) {
    console.error('❌ Payout error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
