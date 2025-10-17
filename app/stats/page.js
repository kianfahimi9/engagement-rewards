'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useIframeSdk } from "@whop/react";
import { Trophy, Flame, Award, DollarSign, TrendingUp, Zap, ArrowLeft, Target, Star, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

// StatsContent component that uses useSearchParams
function StatsContent() {
  const iframeSdk = useIframeSdk();
  const searchParams = useSearchParams();
  const experienceId = searchParams.get('experienceId');
  const [stats, setStats] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  useEffect(() => {
    // Get user ID and company ID from Whop SDK
    const initializeUser = async () => {
      if (iframeSdk?.user?.id) {
        setUserId(iframeSdk.user.id);
      }
      if (iframeSdk?.company?.id) {
        setCompanyId(iframeSdk.company.id);
      }
    };
    
    initializeUser();
  }, [iframeSdk]);

  useEffect(() => {
    if (userId && companyId) {
      fetchUserStats();
    }
  }, [userId, companyId]);

  const fetchUserStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user-stats?userId=${userId}&companyId=${companyId}`);
      const data = await response.json();
      
      if (data.success) {
        // API returns data.user, map it to stats
        setStats(data.user);
        setEarnings(data.earnings || []);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userId || !companyId) {
    return (
      <div className="min-h-screen bg-[#FCF6F5] dark:bg-[#141212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FA4616]"></div>
      </div>
    );
  }

  const nextLevelPoints = Math.ceil((stats?.totalPoints || 0) / 100 + 1) * 100;
  const progressToNextLevel = ((stats?.totalPoints || 0) % 100);

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
                <Star className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-base md:text-xl font-semibold text-gray-900 dark:text-white">My Stats</h1>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Track your progress</p>
              </div>
            </div>
            <div className="w-0 md:w-24"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-7xl">
        {/* Above the Fold Hero Section */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Total Earnings - Most Prominent */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-[#FA4616] to-orange-600 text-white overflow-hidden relative">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-6 w-6 md:h-8 md:w-8" />
                    <p className="text-white/80 text-sm md:text-base font-medium">Total Earnings</p>
                  </div>
                  <h2 className="text-5xl md:text-7xl font-bold mb-4">
                    ${earnings.reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2)}
                  </h2>
                  <p className="text-white/90 text-sm md:text-base">
                    From {earnings.length} prize pool{earnings.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="hidden md:block opacity-20">
                  <Trophy className="h-32 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress & Stats - All in One */}
        <Card className="border-0 shadow-lg bg-white dark:bg-gray-950 mb-6 md:mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16 md:h-20 md:w-20 ring-4 ring-gray-100 dark:ring-gray-800">
                <AvatarImage src={stats?.avatar_url} />
                <AvatarFallback className="bg-[#FA4616] text-white text-2xl md:text-3xl font-semibold">
                  {stats?.username?.slice(0, 2).toUpperCase() || 'ME'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                  {stats?.username || 'Your Name'}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-[#FA4616] text-white border-0">
                    Level {Math.floor((stats?.totalPoints || 0) / 100)}
                  </Badge>
                  <Badge variant="outline" className="border-orange-400 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 gap-1">
                    <Flame className="h-3 w-3" />
                    {stats?.currentStreak || 0} day streak
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Level Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Progress to Level {Math.floor((stats?.totalPoints || 0) / 100) + 1}
                  </span>
                  <span className="font-bold text-[#FA4616]">
                    {stats?.totalPoints || 0} / {nextLevelPoints}
                  </span>
                </div>
                <Progress value={progressToNextLevel} className="h-3 bg-gray-100 dark:bg-gray-800" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {100 - progressToNextLevel} points to next level
                </p>
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-800" />

              {/* Rank & Points Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-[#FA4616]" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Rank</span>
                  </div>
                  <p className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                    #{stats?.rank || '-'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-[#FA4616]" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Points</span>
                  </div>
                  <p className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalPoints || 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Below the Fold Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Recent Earnings */}
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <Trophy className="h-5 w-5 text-[#FA4616]" />
                Recent Earnings
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Your prize pool winnings</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {earnings.length > 0 ? (
                <div className="space-y-3">
                  {earnings.map((earning, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center gap-4">
                        <div className="bg-[#FA4616] p-3 rounded-2xl">
                          {earning.rank === 1 ? <Crown className="h-5 w-5 text-white" /> : <Trophy className="h-5 w-5 text-white" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {earning.rank === 1 ? '🥇' : earning.rank === 2 ? '🥈' : earning.rank === 3 ? '🥉' : '🏆'} Rank #{earning.rank}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(earning.date).toLocaleDateString()} · {earning.period}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">${earning.amount}</p>
                        <Badge className={earning.status === 'completed' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-0' : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-0'}>
                          {earning.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <DollarSign className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No earnings yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Climb the leaderboard to win prizes!</p>
                  <Link href="/">
                    <Button className="bg-[#FA4616] hover:bg-[#FA4616]/90 text-white">
                      View Leaderboard
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <Award className="h-5 w-5 text-[#FA4616]" />
                Achievements
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Unlock rewards by hitting milestones</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats?.badges?.map((badge, i) => (
                  <div
                    key={i}
                    className={`p-5 rounded-2xl text-center transition-all ${
                      badge.unlocked
                        ? 'bg-gray-50 dark:bg-gray-900 border-2 border-[#FA4616] hover:scale-105'
                        : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 opacity-40'
                    }`}
                  >
                    <div className="text-4xl mb-3">{badge.icon}</div>
                    <p className="font-semibold text-sm mb-1 text-gray-900 dark:text-white">{badge.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
                    {badge.unlocked && (
                      <Badge className="mt-3 bg-[#FA4616] text-white border-0 text-xs">Unlocked</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Breakdown - Full Width */}
          <Card className="lg:col-span-2 border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <Target className="h-5 w-5 text-[#FA4616]" />
                Activity Breakdown
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Your engagement metrics</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Logins', value: stats?.totalLogins || 0, icon: '📅' },
                  { label: 'Likes Received', value: stats?.likesReceived || 0, icon: '❤️' },
                  { label: 'Comments Received', value: stats?.commentsReceived || 0, icon: '💬' },
                  { label: 'Shares Received', value: stats?.sharesReceived || 0, icon: '🔄' },
                ].map((stat, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center">
                    <div className="text-4xl mb-3">{stat.icon}</div>
                    <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Wrapper component with Suspense
export default function UserStatsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <StatsContent />
    </Suspense>
  );
}
