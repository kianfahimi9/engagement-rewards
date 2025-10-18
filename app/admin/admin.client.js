'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Activity, ArrowLeft, Plus, Trophy, Clock, CheckCircle, XCircle, BarChart3, Award, Calendar, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIframeSdk } from "@whop/react";
import Link from 'next/link';

export default function AdminView({ experienceId, userId, companyId }) {
  const [prizePools, setPrizePools] = useState([]);
  const [companyBalance, setCompanyBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState({});
  const [stats, setStats] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [paymentError, setPaymentError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Form state
  const [newPoolAmount, setNewPoolAmount] = useState('');
  const [periodType, setPeriodType] = useState('weekly');
  const [endDate, setEndDate] = useState('');
  
  const iframeSdk = useIframeSdk();

  useEffect(() => {
    fetchPrizePools();
  }, []);

  const fetchPrizePools = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/prize-pools?experienceId=${experienceId}&companyId=${companyId}&userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setPrizePools(data.prizePools || []);
        setCompanyBalance(data.companyBalance);
        setStats(data.stats || {
          totalMembers: 0,
          activePool: '0.00',
          totalPaidOut: '0.00',
          engagementRate: 0
        });
        setPayouts(data.payouts || []);
      }
    } catch (error) {
      console.error('Error fetching prize pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrizePool = async () => {
    setCreating(true);
    
    try {
      const amount = parseFloat(newPoolAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      const response = await fetch('/api/admin/prize-pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          periodType,
          endDate: endDate || null,
          experienceId,
          companyId,
          userId
        })
      });

      const data = await response.json();

      // If insufficient balance, trigger Whop checkout
      if (data.needsPayment) {
        alert(`Insufficient balance! You have $${data.currentBalance}, but need $${data.required}. Adding funds...`);
        
        // Trigger Whop checkout modal
        const checkoutResult = await iframeSdk.showCheckout({
          experienceId: experienceId,
          successUrl: window.location.href,
          cancelUrl: window.location.href
        });
        
        console.log('Checkout result:', checkoutResult);
        
        // Refresh balance after checkout
        await fetchPrizePools();
        return;
      }

      if (data.success) {
        alert('Prize pool created successfully!');
        setDialogOpen(false);
        setNewPoolAmount('');
        setPeriodType('weekly');
        setEndDate('');
        fetchPrizePools();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating prize pool:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handlePayout = async (prizePoolId) => {
    if (!confirm('Are you sure you want to distribute this prize pool to the top 10 winners?')) {
      return;
    }

    setPayoutLoading(prev => ({ ...prev, [prizePoolId]: true }));

    try {
      const response = await fetch('/api/admin/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prizePoolId,
          experienceId,
          companyId,
          userId
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Successfully paid out ${data.payouts.length} winners! Total: $${data.totalPaid.toFixed(2)}`);
        fetchPrizePools();
      } else {
        alert(`❌ Payout failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error during payout:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setPayoutLoading(prev => ({ ...prev, [prizePoolId]: false }));
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href={`/experiences/${experienceId}`}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Leaderboard
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Manage prize pools and payouts</p>
          </div>
        </div>

        {/* Create Prize Pool Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Prize Pools</h2>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#FA4616] hover:bg-[#FA4616]/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Prize Pool
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Prize Pool</DialogTitle>
                <DialogDescription>
                  Set up a prize pool for your community. Top 10 winners will receive payouts.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Prize Pool Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="100.00"
                    value={newPoolAmount}
                    onChange={(e) => setNewPoolAmount(e.target.value)}
                    min="1"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Period Type</Label>
                  <Select value={periodType} onValueChange={setPeriodType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="all_time">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Leave empty for 7 days from now</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg text-sm">
                  <p className="font-semibold mb-1">Prize Distribution:</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    1st: 40% • 2nd: 18% • 3rd: 12% • 4th: 8% • 5th: 6%
                    <br />
                    6th: 5% • 7th: 4% • 8th: 3% • 9th: 2% • 10th: 2%
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePrizePool}
                  className="flex-1 bg-[#FA4616] hover:bg-[#FA4616]/90"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Prize Pool'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {/* Prize Pools List */}
        <div className="grid gap-4">
          {prizePools.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No prize pools yet. Create one to get started!</p>
              </CardContent>
            </Card>
          ) : (
            prizePools.map((pool) => (
              <Card key={pool.id} className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Trophy className="h-6 w-6 text-[#FA4616]" />
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          ${pool.amount.toFixed(2)} USD
                        </h3>
                        <Badge
                          variant={pool.status === 'active' ? 'default' : pool.status === 'paid_out' ? 'secondary' : 'destructive'}
                          className={
                            pool.status === 'active' ? 'bg-green-500' :
                            pool.status === 'paid_out' ? 'bg-blue-500' : 'bg-red-500'
                          }
                        >
                          {pool.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">Period</p>
                          <p className="font-semibold capitalize">{pool.period_type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">End Date</p>
                          <p className="font-semibold">
                            {new Date(pool.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Created</p>
                          <p className="font-semibold">
                            {new Date(pool.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {pool.paid_out_at && (
                          <div>
                            <p className="text-sm text-gray-500">Paid Out</p>
                            <p className="font-semibold">
                              {new Date(pool.paid_out_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      {pool.status === 'active' && (
                        <Button
                          onClick={() => handlePayout(pool.id)}
                          disabled={payoutLoading[pool.id]}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {payoutLoading[pool.id] ? 'Processing...' : 'Pay Out Winners'}
                        </Button>
                      )}
                      {pool.status === 'paid_out' && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
