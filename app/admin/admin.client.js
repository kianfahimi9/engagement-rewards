'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Activity, ArrowLeft, Plus, Trophy, Clock, CheckCircle, XCircle, BarChart3, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIframeSdk } from "@whop/react";
import Link from 'next/link';
import { toast } from 'sonner';

export default function AdminView({ experienceId, userId, companyId }) {
  const [stats, setStats] = useState(null);
  const [prizePools, setPrizePools] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPoolAmount, setNewPoolAmount] = useState('');
  const [periodType, setPeriodType] = useState('weekly');
  const [periodStart, setPeriodStart] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const iframeSdk = useIframeSdk();

  // Helper: Get status info with icon and color
  const getStatusInfo = (pool) => {
    const now = new Date();
    const start = new Date(pool.start_date);
    const end = new Date(pool.end_date);

    if (pool.status === 'paid_out') {
      return { 
        label: 'Paid Out', 
        color: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
        icon: '✅',
        canEdit: false,
        canDelete: false
      };
    }

    if (pool.status === 'active') {
      if (now > end) {
        return { 
          label: 'Ended - Ready for Payout', 
          color: 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400',
          icon: '⏰',
          canEdit: false,
          canDelete: false
        };
      }
      return { 
        label: 'Active', 
        color: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400',
        icon: '🟢',
        canEdit: false,
        canDelete: false
      };
    }

    if (pool.status === 'pending') {
      if (now < start) {
        return { 
          label: 'Scheduled', 
          color: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400',
          icon: '📅',
          canEdit: true,
          canDelete: true
        };
      }
    }

    return { 
      label: pool.status || 'Pending', 
      color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
      icon: '⏸️',
      canEdit: false,
      canDelete: false
    };
  };

  // Auto-calculate end date based on period type and start date
  const calculateEndDate = (startDate, type) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const daysToAdd = type === 'weekly' ? 7 : 30;
    const end = new Date(start);
    end.setDate(start.getDate() + daysToAdd);
    return end.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDistributePrizePool = async () => {
    const pool = selectedPool;
    setConfirmDialogOpen(false);
    setPayoutLoading(true);

    const loadingToast = toast.loading('Processing payouts to top 10 winners...');

    try {
      const response = await fetch('/api/admin/payout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prizePoolId: pool.whop_payment_id,
          companyId: companyId,
          experienceId: experienceId,
        }),
      });

      const data = await response.json();

      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success(`Prize pool distributed successfully!`, {
          description: `Paid ${data.payouts.length} winners • Total: $${data.totalPaid.toFixed(2)}`,
          duration: 6000,
        });
        fetchAdminData(); // Refresh
      } else {
        toast.error('Payout failed', {
          description: data.error,
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Distribution error:', error);
      toast.error('Payout failed', {
        description: error.message,
      });
    } finally {
      setPayoutLoading(false);
      setSelectedPool(null);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/dashboard?companyId=${companyId}`);
      const data = await response.json();
      setStats(data.stats);
      setPrizePools(data.prizePools || []);
      setPayouts(data.payouts || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrizePool = async () => {
    setPaymentLoading(true);
    setPaymentError('');
    
    try {
      const amount = parseFloat(newPoolAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (!periodType) {
        throw new Error('Please select a period type');
      }

      if (!periodStart) {
        throw new Error('Please select a start date');
      }

      // Auto-calculate end date
      const periodEnd = calculateEndDate(periodStart, periodType);

      // Create charge using official Whop API method
      const response = await fetch('/api/payments/create-charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          userId: userId,
          companyId: companyId,
          experienceId: experienceId,
          periodType: periodType,
          periodStart: periodStart,
          periodEnd: periodEnd,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.details || 'Failed to create charge');
      }

      // Open payment modal using official iframe SDK method
      const result = await iframeSdk.inAppPurchase(data.inAppPurchase);
      
      console.log('Payment result:', result);
      
      if (result.status === 'ok') {
        console.log('✅ Payment successful:', result.data.receipt_id);
        // Close dialog and reset form
        setDialogOpen(false);
        setNewPoolAmount('');
        setPeriodType('weekly');
        setPeriodStart('');
        setPaymentError('');
        
        // Refresh admin data after a short delay
        setTimeout(() => {
          fetchAdminData();
        }, 2000);
      } else {
        throw new Error(result.error || 'Payment failed');
      }
      
    } catch (error) {
      console.error('Error creating prize pool:', error);
      setPaymentError(error.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCF6F5] dark:bg-[#141212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FA4616]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF6F5] dark:bg-[#141212]">
      {/* Header */}
      <header className="bg-white/90 dark:bg-[#141212]/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center justify-between">
            <Link href={experienceId ? `/experiences/${experienceId}` : '/'}>
              <Button variant="ghost" className="gap-2 text-gray-700 dark:text-gray-300 text-xs md:text-sm px-2 md:px-4">
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
                Back to Leaderboard
              </Button>
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="bg-[#FA4616] p-2 md:p-2.5 rounded-xl md:rounded-2xl">
                <Trophy className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-base md:text-xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Manage prizes & rewards</p>
              </div>
            </div>
            <div className="w-0 md:w-24"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-7xl">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Members</p>
                <Users className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalMembers || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Pool</p>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${stats?.activePool || '0.00'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Paid Out</p>
                <Trophy className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${stats?.totalPaidOut || '0.00'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Prize Pools & Payouts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Prize Pools */}
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                    <DollarSign className="h-5 w-5 text-[#FA4616]" />
                    Prize Pools
                  </CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">Manage community rewards</CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#FA4616] hover:bg-[#FA4616]/90 text-white gap-2">
                      <Plus className="h-4 w-4" />
                      Create Pool
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Prize Pool</DialogTitle>
                      <DialogDescription>
                        Add funds to reward your top contributors
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="periodType">Period Type <span className="text-red-500">*</span></Label>
                        <Select value={periodType} onValueChange={setPeriodType} disabled={paymentLoading}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select period type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly (7 days)</SelectItem>
                            <SelectItem value="monthly">Monthly (30 days)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="periodStart">Start Date <span className="text-red-500">*</span></Label>
                        <Input
                          id="periodStart"
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={periodStart}
                          onChange={(e) => setPeriodStart(e.target.value)}
                          disabled={paymentLoading}
                        />
                        {periodStart && (
                          <p className="text-xs text-gray-500">
                            Ends on: {calculateEndDate(periodStart, periodType)}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount">Prize Amount (USD) <span className="text-red-500">*</span></Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="100.00"
                          value={newPoolAmount}
                          onChange={(e) => setNewPoolAmount(e.target.value)}
                          disabled={paymentLoading}
                        />
                      </div>

                      {paymentError && (
                        <p className="text-sm text-red-500">{paymentError}</p>
                      )}
                      <Button
                        className="w-full bg-[#FA4616] hover:bg-[#FA4616]/90 text-white"
                        onClick={handleCreatePrizePool}
                        disabled={paymentLoading}
                      >
                        {paymentLoading ? 'Processing...' : 'Continue to Payment'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {prizePools.length > 0 ? (
                <div className="space-y-3">
                  {prizePools.map((pool, i) => {
                    const statusInfo = getStatusInfo(pool);
                    return (
                      <div key={i} className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-lg text-gray-900 dark:text-white">${pool.amount}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              <span className="capitalize">{pool.period_type}</span>
                              {pool.start_date && pool.end_date && (
                                <span> • {new Date(pool.start_date).toLocaleDateString()} - {new Date(pool.end_date).toLocaleDateString()}</span>
                              )}
                            </p>
                          </div>
                          <Badge className={`${statusInfo.color} border-0`}>
                            {statusInfo.icon} {statusInfo.label}
                          </Badge>
                        </div>
                        
                        {/* Action buttons based on status */}
                        <div className="flex gap-2 mt-3">
                          {statusInfo.label === 'Ended - Ready for Payout' && (
                            <Button
                              size="sm"
                              className="flex-1 bg-[#FA4616] hover:bg-[#FA4616]/90 text-white"
                              onClick={() => {
                                setSelectedPool(pool);
                                setConfirmDialogOpen(true);
                              }}
                              disabled={payoutLoading}
                            >
                              {payoutLoading && selectedPool?.whop_payment_id === pool.whop_payment_id ? 'Processing...' : '💰 Distribute to Winners'}
                            </Button>
                          )}
                          
                          {statusInfo.canDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleDeletePool(pool.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>

                        {statusInfo.label === 'Scheduled' && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            ⏳ Starts in {Math.ceil((new Date(pool.start_date) - new Date()) / (1000 * 60 * 60 * 24))} days
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No prize pools yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first prize pool to reward contributors</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payouts */}
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <Trophy className="h-5 w-5 text-[#FA4616]" />
                Recent Payouts
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Distribution history</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {payouts.length > 0 ? (
                <div className="space-y-3">
                  {payouts.map((payout, i) => (
                    <div key={i} className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{payout.username}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Rank #{payout.rank}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900 dark:text-white">${payout.amount}</p>
                          <Badge className={payout.status === 'completed' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-0 text-xs' : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-0 text-xs'}>
                            {payout.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No payouts yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">Payouts will appear here once distributed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Prize Distribution</DialogTitle>
            <DialogDescription>
              Are you sure you want to distribute this prize pool?
            </DialogDescription>
          </DialogHeader>
          {selectedPool && (
            <div className="py-4 space-y-3">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Prize Pool Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${selectedPool.amount}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Distribution Breakdown:</p>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p>🥇 1st Place: ${(selectedPool.amount * 0.40).toFixed(2)} (40%)</p>
                  <p>🥈 2nd Place: ${(selectedPool.amount * 0.18).toFixed(2)} (18%)</p>
                  <p>🥉 3rd Place: ${(selectedPool.amount * 0.12).toFixed(2)} (12%)</p>
                  <p>📍 4th-10th: Remaining ${(selectedPool.amount * 0.30).toFixed(2)} (30%)</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This will distribute funds to the top 10 users on the leaderboard for this period.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setConfirmDialogOpen(false);
                setSelectedPool(null);
              }}
              disabled={payoutLoading}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#FA4616] hover:bg-[#FA4616]/90 text-white"
              onClick={handleDistributePrizePool}
              disabled={payoutLoading}
            >
              {payoutLoading ? 'Processing...' : 'Confirm Distribution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
