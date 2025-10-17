'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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

// Force dynamic rendering to use useSearchParams
export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const searchParams = useSearchParams();
  const experienceId = searchParams.get('experienceId');
  const [stats, setStats] = useState(null);
  const [prizePools, setPrizePools] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPoolAmount, setNewPoolAmount] = useState('');
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
      const response = await fetch('/api/admin/dashboard');
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
      // Get current user from iframe SDK
      const currentUser = await iframeSdk.getCurrentUser();
      
      if (!currentUser?.id) {
        throw new Error('User not found');
      }

      // Step 1: Create charge on server
      const response = await fetch('/api/payments/create-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          amount: parseFloat(newPoolAmount),
          communityId: '2b7ecb03-7c43-4aca-ae53-c77cdf766d85', // Real community ID
          periodStart: new Date().toISOString().split('T')[0],
          periodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          title: `Prize Pool - $${newPoolAmount}`,
        })
      });

      const data = await response.json();

      if (!response.ok || !data.inAppPurchase) {
        throw new Error(data.error || 'Failed to create charge');
      }

      // Step 2: Open Whop payment modal
      const paymentResult = await iframeSdk.inAppPurchase(data.inAppPurchase);

      if (paymentResult.status === 'ok') {
        console.log('✅ Payment successful:', paymentResult.data.receipt_id);
        setDialogOpen(false);
        setNewPoolAmount('');
        // Refresh data to show new prize pool
        fetchAdminData();
      } else {
        throw new Error(paymentResult.error || 'Payment failed');
      }

    } catch (error) {
      console.error('Error creating prize pool:', error);
      setPaymentError(error.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleProcessPayouts = async (prizePoolId) => {
    try {
      // Get top 10 users for this prize pool's period
      const response = await fetch(`/api/leaderboard?period=weekly`);
      const data = await response.json();
      
      if (!data.leaderboard || data.leaderboard.length === 0) {
        alert('No users to pay out');
        return;
      }

      const top10 = data.leaderboard.slice(0, 10);
      
      // Get prize pool details
      const poolResponse = await fetch(`/api/admin/dashboard`);
      const poolData = await poolResponse.json();
      const prizePool = poolData.prizePools.find(p => p.id === prizePoolId);
      
      if (!prizePool) {
        alert('Prize pool not found');
        return;
      }

      const totalAmount = parseFloat(prizePool.amount);
      
      // Calculate distribution (40%, 30%, 20%, 10% split among 4-10)
      const distribution = [
        totalAmount * 0.4,  // 1st
        totalAmount * 0.3,  // 2nd
        totalAmount * 0.2,  // 3rd
        ...Array(7).fill(totalAmount * 0.1 / 7), // 4th-10th split
      ];

      // Create winners array with calculated amounts
      const winners = top10.map((user, index) => ({
        userId: user.id,
        whopUserId: user.whop_user_id,
        username: user.username,
        amount: distribution[index],
        rank: index + 1,
      }));

      // Process payouts
      const payoutResponse = await fetch('/api/payments/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prizePoolId,
          winners,
        })
      });
      
      const payoutData = await payoutResponse.json();
      
      if (payoutResponse.ok) {
        alert(`✅ Payouts processed! ${payoutData.results.filter(r => r.status === 'success').length} successful`);
        fetchAdminData();
      } else {
        throw new Error(payoutData.error || 'Failed to process payouts');
      }
    } catch (error) {
      console.error('Error processing payouts:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50 to-orange-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-amber-900/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="bg-[#FA4616] p-2 md:p-2.5 rounded-xl md:rounded-2xl">
                <BarChart3 className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-base md:text-xl font-semibold text-gray-900 dark:text-white">Admin</h1>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Manage rewards</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#FA4616] hover:bg-[#FA4616]/90 text-white text-xs md:text-sm px-2 md:px-4">
                  <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">New Pool</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Prize Pool</DialogTitle>
                  <DialogDescription>
                    Set up a weekly prize pool to reward your top community members via Whop Payments
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {paymentError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
                      ❌ {paymentError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Prize Pool Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="500"
                      value={newPoolAmount}
                      onChange={(e) => setNewPoolAmount(e.target.value)}
                      disabled={paymentLoading}
                    />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Distribution</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>🥇 1st Place (40%)</span>
                        <span className="font-bold">${(parseFloat(newPoolAmount) * 0.4 || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🥈 2nd Place (30%)</span>
                        <span className="font-bold">${(parseFloat(newPoolAmount) * 0.3 || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🥉 3rd Place (20%)</span>
                        <span className="font-bold">${(parseFloat(newPoolAmount) * 0.2 || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🎖️ 4th-10th (10%)</span>
                        <span className="font-bold">${(parseFloat(newPoolAmount) * 0.1 || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                    💳 You'll be redirected to Whop's secure payment page to complete the transaction.
                  </div>
                  <Button 
                    onClick={handleCreatePrizePool} 
                    className="w-full bg-[#FA4616] hover:bg-[#FA4616]/90 text-white"
                    disabled={!newPoolAmount || parseFloat(newPoolAmount) <= 0 || paymentLoading}
                  >
                    {paymentLoading ? 'Processing Payment...' : 'Create Prize Pool'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.totalMembers || 0}</div>
                <Users className="h-10 w-10 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                <span className="text-green-600 dark:text-green-400 font-semibold">+{stats?.newMembersThisWeek || 0}</span> this week
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Paid Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">${stats?.totalPaidOut || 0}</div>
                <DollarSign className="h-10 w-10 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Across {stats?.completedPools || 0} prize pools
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Engagement Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.engagementScore || 0}</div>
                <Activity className="h-10 w-10 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                <span className="text-green-600 dark:text-green-400 font-semibold">↑ {stats?.engagementGrowth || 0}%</span> vs last week
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Streaks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.activeStreaks || 0}</div>
                <TrendingUp className="h-10 w-10 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Members with 7+ day streaks
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Prize Pools */}
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <Trophy className="h-5 w-5" />
                Prize Pools
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Manage active and past prize pools</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {prizePools.length > 0 ? (
                  prizePools.map((pool, i) => (
                    <div key={i} className="p-5 border border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-3xl font-bold text-gray-900 dark:text-white">${pool.amount}</div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(pool.period_start).toLocaleDateString()} - {new Date(pool.period_end).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={
                          pool.status === 'active' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-0' :
                          pool.status === 'completed' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-0' :
                          'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-0'
                        }>
                          {pool.status === 'active' ? <Clock className="h-3 w-3 mr-1" /> : 
                           pool.status === 'paid_out' ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
                          {pool.status}
                        </Badge>
                      </div>
                      {pool.status === 'completed' && (
                        <Button 
                          onClick={() => handleProcessPayouts(pool.id)}
                          className="w-full bg-[#FA4616] hover:bg-[#FA4616]/90 text-white"
                          size="sm"
                        >
                          Process Payouts via Whop
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No prize pools yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Create your first pool to reward members</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Payouts */}
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <DollarSign className="h-5 w-5" />
                Recent Payouts
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Payment history and status</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {payouts.length > 0 ? (
                  payouts.map((payout, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center gap-4">
                        <div className="bg-[#FA4616] p-3 rounded-xl text-2xl">
                          {payout.rank === 1 ? '🥇' : payout.rank === 2 ? '🥈' : payout.rank === 3 ? '🥉' : '🏆'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{payout.username}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Rank #{payout.rank} · {new Date(payout.paid_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white text-xl mb-1">${payout.amount}</p>
                        <Badge variant="outline" className={
                          payout.status === 'completed' ? 'border-0 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                          payout.status === 'processing' ? 'border-0 bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400' :
                          payout.status === 'failed' ? 'border-0 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400' :
                          'border-0 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                        }>
                          {payout.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {payout.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                          {payout.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No payouts yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Engagement Analytics */}
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <BarChart3 className="h-5 w-5" />
                Community Analytics
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Track engagement trends</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Total Posts', value: stats?.totalPosts || 0, icon: '📝' },
                  { label: 'Total Comments', value: stats?.totalComments || 0, icon: '💬' },
                  { label: 'Total Likes', value: stats?.totalLikes || 0, icon: '❤️' },
                  { label: 'Avg. Engagement', value: stats?.avgEngagement || 0, icon: '📊' },
                ].map((metric, i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{metric.icon}</span>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">{metric.value}</div>
                    </div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{metric.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Level Names */}
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <Award className="h-5 w-5" />
                Customize Level Names
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Personalize your community's level titles (Skool-style)</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {[
                  { level: 1, points: 0, defaultName: 'Level 1', placeholder: 'e.g., Newbie' },
                  { level: 2, points: 5, defaultName: 'Level 2', placeholder: 'e.g., Member' },
                  { level: 3, points: 20, defaultName: 'Level 3', placeholder: 'e.g., Regular' },
                  { level: 4, points: 65, defaultName: 'Level 4', placeholder: 'e.g., Contributor' },
                  { level: 5, points: 155, defaultName: 'Level 5', placeholder: 'e.g., Active' },
                  { level: 6, points: 515, defaultName: 'Level 6', placeholder: 'e.g., Veteran' },
                  { level: 7, points: 2015, defaultName: 'Level 7', placeholder: 'e.g., Expert' },
                  { level: 8, points: 8015, defaultName: 'Level 8', placeholder: 'e.g., Master' },
                  { level: 9, points: 33015, defaultName: 'Level 9', placeholder: 'e.g., Legend' },
                  { level: 10, points: 100000, defaultName: 'Level 10', placeholder: 'e.g., The GOAT' },
                ].map((lvl) => (
                  <div key={lvl.level} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <div className="flex-shrink-0 w-16 text-center">
                      <Badge className="bg-[#FA4616] text-white border-0">
                        Lvl {lvl.level}
                      </Badge>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{lvl.points}pts</p>
                    </div>
                    <Input
                      placeholder={lvl.placeholder}
                      defaultValue={lvl.defaultName}
                      className="flex-1 bg-white dark:bg-gray-950"
                    />
                  </div>
                ))}
              </div>
              <Button className="w-full mt-6 bg-[#FA4616] hover:bg-[#FA4616]/90 text-white">
                Save Level Names
              </Button>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                Custom names will appear on leaderboard and member profiles
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
