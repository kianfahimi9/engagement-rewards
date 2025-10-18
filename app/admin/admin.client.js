'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Activity, ArrowLeft, Plus, Trophy, Clock, CheckCircle, XCircle, BarChart3, Award, Calendar, Coins, TestTube, Trash2, Loader2, Crown, Medal, Check, MessageSquare, MessageCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    const start = new Date(pool.start_date || pool.period_start);
    const end = new Date(pool.end_date || pool.period_end);

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

  const handleDeletePool = async (poolId) => {
    if (!confirm('Are you sure you want to delete this scheduled prize pool?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/prize-pools?prizePoolId=${poolId}&userId=${userId}&experienceId=${experienceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Prize pool deleted');
        fetchAdminData();
      } else {
        toast.error('Failed to delete', {
          description: data.error,
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete', {
        description: error.message,
      });
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

      // Handle overlap error specifically
      if (response.status === 409) {
        const suggestion = data.details?.suggestion || 'Please choose different dates';
        toast.error('Schedule Conflict', {
          description: data.error + '. ' + suggestion,
          duration: 6000,
        });
        setPaymentError(data.error);
        setPaymentLoading(false);
        return;
      }

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
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#FA4616]/10 p-2.5 rounded-xl">
                    <DollarSign className="h-5 w-5 text-[#FA4616]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900 dark:text-white">Prize Pools</CardTitle>
                    <CardDescription>Manage community rewards</CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setDialogOpen(true);
                    setPaymentError('');
                  }}
                  className="bg-[#FA4616] hover:bg-[#FA4616]/90 text-white"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Pool
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {prizePools.length > 0 ? (
                <div className="space-y-3">
                  {prizePools.map((pool, i) => {
                    const statusInfo = getStatusInfo(pool);
                    const startDate = pool.start_date || pool.period_start ? new Date(pool.start_date || pool.period_start) : null;
                    const endDate = pool.end_date || pool.period_end ? new Date(pool.end_date || pool.period_end) : null;
                    const now = new Date();
                    const daysUntilEnd = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : 0;
                    
                    return (
                      <div key={i} className="group p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-[#FA4616]/30 dark:hover:border-[#FA4616]/30 transition-all hover:shadow-lg">
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="bg-[#FA4616]/10 p-3 rounded-xl">
                              <Trophy className="h-6 w-6 text-[#FA4616]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-2xl text-gray-900 dark:text-white">${Math.round(pool.amount)}</p>
                                <Badge className={`${statusInfo.color} border-0 text-xs`}>
                                  {statusInfo.icon} {statusInfo.label}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="capitalize font-medium">{pool.period_type}</span>
                                </div>
                                {startDate && endDate ? (
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>No dates set</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar for Active Pools */}
                        {statusInfo.label === 'Active' && daysUntilEnd > 0 && (
                          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl">
                            <div className="flex items-center justify-between text-xs text-green-700 dark:text-green-400 mb-2">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                <span className="font-medium">Time remaining</span>
                              </div>
                              <span className="font-bold">{daysUntilEnd} {daysUntilEnd === 1 ? 'day' : 'days'}</span>
                            </div>
                            <div className="w-full bg-green-200 dark:bg-green-900/30 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all" 
                                style={{ width: `${Math.max(10, Math.min(100, (daysUntilEnd / 7) * 100))}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Scheduled Info */}
                        {statusInfo.label === 'Scheduled' && startDate && (
                          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                            <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-400">
                              <Calendar className="h-3.5 w-3.5" />
                              <span className="font-medium">Starts in {Math.ceil((startDate - now) / (1000 * 60 * 60 * 24))} days</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {statusInfo.label === 'Ended - Ready for Payout' && (
                            <Button
                              size="sm"
                              className="flex-1 bg-[#FA4616] hover:bg-[#FA4616]/90 text-white font-medium"
                              onClick={() => {
                                setSelectedPool(pool);
                                setConfirmDialogOpen(true);
                              }}
                              disabled={payoutLoading}
                            >
                              {payoutLoading && selectedPool?.whop_payment_id === pool.whop_payment_id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Coins className="h-4 w-4 mr-2" />
                                  Distribute to Winners
                                </>
                              )}
                            </Button>
                          )}

                          {/* TEMPORARY: Test Payout button for active pools */}
                          {statusInfo.label === 'Active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/20 font-medium"
                              onClick={() => {
                                setSelectedPool(pool);
                                setConfirmDialogOpen(true);
                              }}
                              disabled={payoutLoading}
                            >
                              <TestTube className="h-4 w-4 mr-2" />
                              Test Payout
                            </Button>
                          )}
                          
                          {statusInfo.canDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 font-medium"
                              onClick={() => handleDeletePool(pool.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="bg-gray-100 dark:bg-gray-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No prize pools yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first prize pool to reward top contributors</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payouts */}
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-[#FA4616]/10 p-2.5 rounded-xl">
                  <Trophy className="h-5 w-5 text-[#FA4616]" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">Recent Payouts</CardTitle>
                  <CardDescription>Distribution history</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {payouts && payouts.length > 0 ? (
                <div className="space-y-3">
                  {payouts.map((payout, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#FA4616]/20 dark:hover:border-[#FA4616]/20 transition-all">
                      {/* Rank Icon */}
                      <div className="flex-shrink-0">
                        {payout.rank === 1 && (
                          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-2.5 rounded-xl">
                            <Crown className="h-5 w-5 text-white" />
                          </div>
                        )}
                        {payout.rank === 2 && (
                          <div className="bg-gradient-to-br from-gray-300 to-gray-500 p-2.5 rounded-xl">
                            <Medal className="h-5 w-5 text-white" />
                          </div>
                        )}
                        {payout.rank === 3 && (
                          <div className="bg-gradient-to-br from-amber-600 to-amber-800 p-2.5 rounded-xl">
                            <Medal className="h-5 w-5 text-white" />
                          </div>
                        )}
                        {payout.rank > 3 && (
                          <div className="bg-gray-200 dark:bg-gray-800 p-2.5 rounded-xl w-10 h-10 flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">#{payout.rank}</span>
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 ring-2 ring-gray-100 dark:ring-gray-800">
                          <AvatarImage src={payout.users?.avatar_url} />
                          <AvatarFallback className="bg-[#FA4616] text-white text-sm font-semibold">
                            {payout.users?.username?.slice(0, 2).toUpperCase() || '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {payout.users?.username || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Rank #{payout.rank}
                          </p>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-lg text-[#FA4616]">
                          ${typeof payout.amount === 'number' ? payout.amount.toFixed(2) : parseFloat(payout.amount || 0).toFixed(2)}
                        </p>
                        <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-400 text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="bg-gray-100 dark:bg-gray-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No payouts yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">Payouts will appear here once prize pools are distributed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Community Engagement Analytics */}
        <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-[#FA4616]/10 p-2.5 rounded-xl">
                <BarChart3 className="h-5 w-5 text-[#FA4616]" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">Community Analytics</CardTitle>
                <CardDescription>Engagement insights & metrics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Posts */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-blue-500 p-1.5 rounded-lg">
                    <MessageSquare className="h-3.5 w-3.5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Forum Posts</p>
                </div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats?.communityEngagement?.totalPosts || 0}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Total created</p>
              </div>

              {/* Total Replies */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-green-500 p-1.5 rounded-lg">
                    <MessageCircle className="h-3.5 w-3.5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">Replies</p>
                </div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {stats?.communityEngagement?.totalReplies || 0}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">Total comments</p>
              </div>

              {/* Total Reactions */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-purple-500 p-1.5 rounded-lg">
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-400">Reactions</p>
                </div>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {stats?.communityEngagement?.totalReactions || 0}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">Likes & votes</p>
              </div>

              {/* Total Views */}
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-orange-500 p-1.5 rounded-lg">
                    <TrendingUp className="h-3.5 w-3.5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-orange-700 dark:text-orange-400">Views</p>
                </div>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {stats?.communityEngagement?.totalViews || 0}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">Content views</p>
              </div>
            </div>

            {/* Engagement Breakdown */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">User Activity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active Members */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                    <Users className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {stats?.communityEngagement?.activeMembers || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stats?.communityEngagement?.activeMembers && stats?.totalMembers 
                      ? `${Math.round((stats.communityEngagement.activeMembers / stats.totalMembers) * 100)}% of total`
                      : 'Posted or commented'
                    }
                  </p>
                </div>

                {/* Top Contributor */}
                <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Top Contributor</p>
                    <Crown className="h-4 w-4 text-amber-500" />
                  </div>
                  {stats?.communityEngagement?.topContributor ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-amber-200 dark:ring-amber-800">
                        <AvatarImage src={stats.communityEngagement.topContributor.avatar_url} />
                        <AvatarFallback className="bg-[#FA4616] text-white text-sm font-semibold">
                          {stats.communityEngagement.topContributor.username?.slice(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-amber-900 dark:text-amber-100 truncate">
                          {stats.communityEngagement.topContributor.username}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                            <Award className="h-3 w-3" />
                            Lvl {stats.communityEngagement.topContributor.level || 1}
                          </span>
                          <span className="text-amber-600 dark:text-amber-500">•</span>
                          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                            <Zap className="h-3 w-3" />
                            {Math.round(stats.communityEngagement.topContributor.points)} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-700 dark:text-amber-400">No activity yet</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Prize Pool Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
              {/* Test Payout Warning */}
              {selectedPool.status === 'active' && new Date(selectedPool.end_date) > new Date() && (
                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-400 mb-1">
                    🧪 Test Mode - Development Only
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-500">
                    This pool hasn't ended yet. In production, payouts only happen after the end date. This is for testing purposes only.
                  </p>
                </div>
              )}

              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Prize Pool Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${selectedPool.amount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedPool.period_type} • {selectedPool.start_date && new Date(selectedPool.start_date).toLocaleDateString()} - {selectedPool.end_date && new Date(selectedPool.end_date).toLocaleDateString()}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Proportional Distribution:</p>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p>• Distributes 100% of prize pool to all winners</p>
                  <p>• Winners get proportional amounts based on their rank</p>
                  <p>• No funds remain undistributed</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg mt-2">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Example with 2 winners: 1st gets ~69%, 2nd gets ~31%
                  </p>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This will distribute funds to the top leaderboard users for this period.
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
