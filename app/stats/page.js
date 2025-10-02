'use client';

import { useState, useEffect } from 'react';
import { Trophy, Flame, Award, DollarSign, TrendingUp, Zap, ArrowLeft, Calendar, Target, Star, Crown } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const nextLevelPoints = Math.ceil((stats?.totalPoints || 0) / 100 + 1) * 100;
  const progressToNextLevel = ((stats?.totalPoints || 0) % 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Leaderboard
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-amber-500 p-2 rounded-xl">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">My Stats</h1>
                <p className="text-sm text-muted-foreground">Track your progress</p>
              </div>
            </div>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-2 border-purple-300 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Avatar className="h-24 w-24 mx-auto ring-4 ring-purple-300 mb-4">
                    <AvatarImage src={stats?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-3xl">
                      {stats?.username?.slice(0, 2).toUpperCase() || 'ME'}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold mb-2">{stats?.username || 'Your Name'}</h2>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg px-4 py-1">
                    Level {Math.floor((stats?.totalPoints || 0) / 100)}
                  </Badge>
                </div>

                <Separator className="my-6" />

                {/* Level Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Progress to Level {Math.floor((stats?.totalPoints || 0) / 100) + 1}</span>
                    <span className="font-bold text-purple-600">
                      {stats?.totalPoints || 0} / {nextLevelPoints}
                    </span>
                  </div>
                  <Progress value={progressToNextLevel} className="h-3" />
                  <p className="text-xs text-muted-foreground text-center">
                    {100 - progressToNextLevel} points to next level
                  </p>
                </div>

                <Separator className="my-6" />

                {/* Quick Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium">Rank</span>
                    </div>
                    <span className="text-xl font-bold">#{stats?.rank || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-500" />
                      <span className="font-medium">Total Points</span>
                    </div>
                    <span className="text-xl font-bold">{stats?.totalPoints || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Engagement</span>
                    </div>
                    <span className="text-xl font-bold">{stats?.engagementGenerated || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Streak Card */}
            <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Streak Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">🔥</div>
                  <div className="text-4xl font-bold text-orange-600 mb-1">
                    {stats?.currentStreak || 0} Days
                  </div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between text-center">
                  <div>
                    <p className="text-2xl font-bold">{stats?.longestStreak || 0}</p>
                    <p className="text-xs text-muted-foreground">Longest Streak</p>
                  </div>
                  <Separator orientation="vertical" />
                  <div>
                    <p className="text-2xl font-bold">
                      {stats?.currentStreak >= 7 ? '✅' : Math.max(0, 7 - (stats?.currentStreak || 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Days to Bonus</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Earnings Card */}
            <Card className="border-2 border-green-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <DollarSign className="h-6 w-6 text-green-500" />
                      Earnings Overview
                    </CardTitle>
                    <CardDescription>Your rewards from prize pools</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${earnings.reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {earnings.length > 0 ? (
                  <div className="space-y-3">
                    {earnings.map((earning, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-500 p-3 rounded-xl">
                            {earning.rank === 1 ? <Crown className="h-5 w-5 text-white" /> : <Trophy className="h-5 w-5 text-white" />}
                          </div>
                          <div>
                            <p className="font-bold">
                              {earning.rank === 1 ? '🥇' : earning.rank === 2 ? '🥈' : earning.rank === 3 ? '🥉' : '🏆'} Rank #{earning.rank}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(earning.date).toLocaleDateString()} • {earning.period}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">${earning.amount}</p>
                          <Badge className={earning.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}>
                            {earning.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No earnings yet</h3>
                    <p className="text-muted-foreground mb-4">Climb the leaderboard to win prizes!</p>
                    <Link href="/">
                      <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                        View Leaderboard
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Badges & Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-500" />
                  Badges & Achievements
                </CardTitle>
                <CardDescription>Unlock rewards by hitting milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {stats?.badges?.map((badge, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        badge.unlocked
                          ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-300 hover:scale-105'
                          : 'bg-gray-100 dark:bg-gray-800 border-gray-300 opacity-50'
                      }`}
                    >
                      <div className="text-4xl mb-2">{badge.icon}</div>
                      <p className="font-bold text-sm mb-1">{badge.name}</p>
                      <p className="text-xs text-muted-foreground">{badge.description}</p>
                      {badge.unlocked && (
                        <Badge className="mt-2 bg-green-500">Unlocked ✓</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  Activity Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Total Logins', value: stats?.totalLogins || 0, icon: '📅', color: 'blue' },
                    { label: 'Likes Received', value: stats?.likesReceived || 0, icon: '❤️', color: 'pink' },
                    { label: 'Comments Received', value: stats?.commentsReceived || 0, icon: '💬', color: 'purple' },
                    { label: 'Shares Received', value: stats?.sharesReceived || 0, icon: '🔄', color: 'green' },
                  ].map((stat, i) => (
                    <div key={i} className={`p-4 rounded-xl bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 dark:from-${stat.color}-900/20 dark:to-${stat.color}-900/30 border`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{stat.icon}</span>
                        <span className="text-3xl font-bold">{stat.value}</span>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
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