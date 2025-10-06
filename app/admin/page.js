'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Activity, ArrowLeft, Plus, Trophy, Clock, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [prizePools, setPrizePools] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPoolAmount, setNewPoolAmount] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

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
    try {
      const response = await fetch('/api/admin/prize-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(newPoolAmount),
          communityId: 'comm_1' // Will be dynamic with Whop integration
        })
      });
      
      if (response.ok) {
        setNewPoolAmount('');
        setDialogOpen(false);
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error creating prize pool:', error);
    }
  };

  const handleProcessPayouts = async (prizePoolId) => {
    try {
      const response = await fetch('/api/admin/process-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizePoolId })
      });
      
      if (response.ok) {
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error processing payouts:', error);
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
            <Link href="/">
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
                    Set up a weekly prize pool to reward your top community members
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Prize Pool Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="500"
                      value={newPoolAmount}
                      onChange={(e) => setNewPoolAmount(e.target.value)}
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
                  <Button 
                    onClick={handleCreatePrizePool} 
                    className="w-full bg-[#FA4616] hover:bg-[#FA4616]/90 text-white"
                    disabled={!newPoolAmount || parseFloat(newPoolAmount) <= 0}
                  >
                    Create Prize Pool
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                          className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
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
                        <div className="bg-black dark:bg-white p-3 rounded-xl text-2xl">
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

        {/* Engagement Analytics */}
        <Card className="mt-8 border-0 shadow-lg bg-white dark:bg-gray-950">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <BarChart3 className="h-5 w-5" />
              Community Analytics
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Track engagement trends and member activity</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { label: 'Total Posts', value: stats?.totalPosts || 0, icon: '📝' },
                { label: 'Total Comments', value: stats?.totalComments || 0, icon: '💬' },
                { label: 'Total Likes', value: stats?.totalLikes || 0, icon: '❤️' },
                { label: 'Avg. Engagement', value: stats?.avgEngagement || 0, icon: '📊' },
              ].map((metric, i) => (
                <div key={i} className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{metric.icon}</span>
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">{metric.value}</div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
