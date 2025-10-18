'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Activity, ArrowLeft, Plus, Trophy, Clock, CheckCircle, XCircle, BarChart3, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useIframeSdk } from "@whop/react";
import Link from 'next/link';

export default function AdminView({ experienceId, userId, companyId }) {
  const [stats, setStats] = useState(null);
  const [prizePools, setPrizePools] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPoolAmount, setNewPoolAmount] = useState('');
  const [periodType, setPeriodType] = useState('weekly');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  
  const iframeSdk = useIframeSdk();

  useEffect(() => {
    fetchAdminData();
  }, []);

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

      // Validate dates if provided
      if (periodStart && periodEnd && new Date(periodStart) >= new Date(periodEnd)) {
        throw new Error('End date must be after start date');
      }

      // Create charge using official Whop API method
      // userId is passed as prop from server component
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
          periodStart: periodStart || null,
          periodEnd: periodEnd || null,
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
        // Close dialog and refresh
        setDialogOpen(false);
        setNewPoolAmount('');
        
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
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

          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Engagement Rate</p>
                <Activity className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.engagementRate || '0'}%
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
                        <Label htmlFor="amount">Amount (USD)</Label>
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
                  {prizePools.map((pool, i) => (
                    <div key={i} className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-lg text-gray-900 dark:text-white">${pool.amount}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {pool.period_start} - {pool.period_end}
                          </p>
                        </div>
                        <Badge className={pool.status === 'active' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-0' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-0'}>
                          {pool.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}
