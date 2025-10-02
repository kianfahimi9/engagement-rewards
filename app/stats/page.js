'use client';

import { useState, useEffect } from 'react';
import { Trophy, Flame, Award, DollarSign, TrendingUp, Zap, ArrowLeft, Target, Star, Crown, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function UserStatsPage() {
  const [stats, setStats] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user-stats');
      const data = await response.json();
      setStats(data.stats);
      setEarnings(data.earnings || []);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  const nextLevelPoints = Math.ceil((stats?.totalPoints || 0) / 100 + 1) * 100;
  const progressToNextLevel = ((stats?.totalPoints || 0) % 100);

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
                <Star className="h-6 w-6 text-white dark:text-black" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">My Stats</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Track your progress</p>
              </div>
            </div>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <Avatar className="h-24 w-24 mx-auto ring-4 ring-gray-100 dark:ring-gray-800 mb-5">
                    <AvatarImage src={stats?.avatar_url} />
                    <AvatarFallback className="bg-black dark:bg-white text-white dark:text-black text-3xl font-semibold">
                      {stats?.username?.slice(0, 2).toUpperCase() || 'ME'}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">{stats?.username || 'Your Name'}</h2>
                  <Badge className="bg-black dark:bg-white text-white dark:text-black text-base px-5 py-1.5 border-0">
                    Level {Math.floor((stats?.totalPoints || 0) / 100)}
                  </Badge>
                </div>

                <Separator className="my-8 bg-gray-100 dark:bg-gray-800" />

                {/* Level Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Level {Math.floor((stats?.totalPoints || 0) / 100) + 1}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stats?.totalPoints || 0} / {nextLevelPoints}
                    </span>
                  </div>
                  <Progress value={progressToNextLevel} className="h-2 bg-gray-100 dark:bg-gray-800" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {100 - progressToNextLevel} points to next level
                  </p>
                </div>

                <Separator className="my-8 bg-gray-100 dark:bg-gray-800" />

                {/* Quick Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      <span className="font-medium text-gray-900 dark:text-white">Rank</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">#{stats?.rank || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      <span className="font-medium text-gray-900 dark:text-white">Points</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalPoints || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      <span className="font-medium text-gray-900 dark:text-white">Engagement</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{stats?.engagementGenerated || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Streak Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
              <CardHeader className="border-b border-orange-100 dark:border-orange-900">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Streak Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-3">🔥</div>
                  <div className="text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                    {stats?.currentStreak || 0}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
                </div>
                <Separator className="my-6 bg-orange-100 dark:bg-orange-900" />
                <div className="flex justify-between text-center">
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.longestStreak || 0}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Best Streak</p>
                  </div>
                  <Separator orientation="vertical" className="bg-orange-100 dark:bg-orange-900" />
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats?.currentStreak >= 7 ? '✅' : Math.max(0, 7 - (stats?.currentStreak || 0))}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">To Bonus</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Earnings */}
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl text-gray-900 dark:text-white">
                      <DollarSign className="h-6 w-6" />
                      Earnings
                    </CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">Your rewards from prize pools</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Earned</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">
                      ${earnings.reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {earnings.length > 0 ? (
                  <div className="space-y-3">
                    {earnings.map((earning, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-4">
                          <div className="bg-black dark:bg-white p-3 rounded-2xl">
                            {earning.rank === 1 ? <Crown className="h-5 w-5 text-white dark:text-black" /> : <Trophy className="h-5 w-5 text-white dark:text-black" />}
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
                      <Button className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100">
                        View Leaderboard
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <Award className="h-5 w-5" />
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
                          ? 'bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white hover:scale-105'
                          : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 opacity-40'
                      }`}
                    >
                      <div className="text-4xl mb-3">{badge.icon}</div>
                      <p className="font-semibold text-sm mb-1 text-gray-900 dark:text-white">{badge.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
                      {badge.unlocked && (
                        <Badge className="mt-3 bg-black dark:bg-white text-white dark:text-black border-0">Unlocked</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity */}
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <Target className="h-5 w-5" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Logins', value: stats?.totalLogins || 0, icon: '📅' },
                    { label: 'Likes', value: stats?.likesReceived || 0, icon: '❤️' },
                    { label: 'Comments', value: stats?.commentsReceived || 0, icon: '💬' },
                    { label: 'Shares', value: stats?.sharesReceived || 0, icon: '🔄' },
                  ].map((stat, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl">{stat.icon}</span>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}