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
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="gap-2 text-gray-700 dark:text-gray-300">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="bg-black dark:bg-white p-2.5 rounded-2xl">
                <BarChart3 className="h-6 w-6 text-white dark:text-black" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your community rewards</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100">
                  <Plus className="h-4 w-4 mr-2" />
                  New Prize Pool
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
                    className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prize Pools */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-500" />
                Prize Pools
              </CardTitle>
              <CardDescription>Manage active and past prize pools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prizePools.length > 0 ? (
                  prizePools.map((pool, i) => (
                    <div key={i} className="p-4 border rounded-xl bg-gradient-to-r from-blue-50 to-amber-50 dark:from-blue-900/20 dark:to-amber-900/20">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">${pool.amount}</div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(pool.period_start).toLocaleDateString()} - {new Date(pool.period_end).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={
                          pool.status === 'active' ? 'bg-green-500' :
                          pool.status === 'completed' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }>
                          {pool.status === 'active' ? <Clock className="h-3 w-3 mr-1" /> : 
                           pool.status === 'paid_out' ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
                          {pool.status}
                        </Badge>
                      </div>
                      {pool.status === 'completed' && (
                        <Button 
                          onClick={() => handleProcessPayouts(pool.id)}
                          className="w-full bg-gradient-to-r from-blue-500 to-amber-500"
                          size="sm"
                        >
                          Process Payouts via Whop
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">No prize pools yet</p>
                    <p className="text-sm text-muted-foreground mb-4">Create your first pool to reward members</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Payouts */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Recent Payouts
              </CardTitle>
              <CardDescription>Payment history and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payouts.length > 0 ? (
                  payouts.map((payout, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                          {payout.rank === 1 ? '🥇' : payout.rank === 2 ? '🥈' : payout.rank === 3 ? '🥉' : '🏆'}
                        </div>
                        <div>
                          <p className="font-semibold">{payout.username}</p>
                          <p className="text-sm text-muted-foreground">
                            Rank #{payout.rank} • {new Date(payout.paid_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${payout.amount}</p>
                        <Badge variant="outline" className={
                          payout.status === 'completed' ? 'border-green-500 text-green-600' :
                          payout.status === 'processing' ? 'border-yellow-500 text-yellow-600' :
                          payout.status === 'failed' ? 'border-red-500 text-red-600' :
                          'border-gray-500 text-gray-600'
                        }>
                          {payout.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {payout.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                          {payout.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">No payouts yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Analytics */}
        <Card className="mt-6 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Community Engagement Analytics
            </CardTitle>
            <CardDescription>Track engagement trends and member activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Posts', value: stats?.totalPosts || 0, icon: '📝', color: 'blue' },
                { label: 'Total Comments', value: stats?.totalComments || 0, icon: '💬', color: 'purple' },
                { label: 'Total Likes', value: stats?.totalLikes || 0, icon: '❤️', color: 'pink' },
                { label: 'Avg. Engagement/User', value: stats?.avgEngagement || 0, icon: '📊', color: 'green' },
              ].map((metric, i) => (
                <div key={i} className="p-4 rounded-xl border bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{metric.icon}</span>
                    <div className="text-3xl font-bold">{metric.value}</div>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
