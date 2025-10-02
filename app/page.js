'use client';

import { useState, useEffect } from 'react';
import { Trophy, Flame, Crown, Medal, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function CommunityLeaderboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [prizePool, setPrizePool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, [selectedPeriod]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?period=${selectedPeriod}`);
      const data = await response.json();
      setLeaderboardData(data.leaderboard || []);
      setCurrentUser(data.currentUser || null);
      setPrizePool(data.prizePool || null);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Header with Navigation */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-amber-500 p-2 rounded-xl">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-amber-600 bg-clip-text text-transparent">
                  Community Leaderboard
                </h1>
                <p className="text-sm text-muted-foreground">Compete & earn rewards!</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/stats">
                <Button variant="outline" className="gap-2">
                  My Stats
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/admin">
                <Button className="bg-gradient-to-r from-blue-500 to-amber-500 hover:from-blue-600 hover:to-amber-600">
                  Admin Panel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Prize Pool Banner */}
        {prizePool && (
          <Card className="mb-6 border-2 border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-green-500 p-4 rounded-2xl">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">
                      ${prizePool.amount} Prize Pool
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ends {new Date(prizePool.period_end).toLocaleDateString()} • Top 10 share rewards
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                    🔥 Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Your Rank Card */}
        {currentUser && (
          <Card className="mb-6 border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-amber-50 dark:from-blue-900/20 dark:to-amber-900/20">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-4 ring-blue-300">
                    <AvatarImage src={currentUser.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-amber-500 text-white text-xl">
                      {currentUser.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Your Current Rank</p>
                    <h3 className="text-3xl font-bold">#{currentUser.rank}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="secondary" className="gap-1">
                        <Zap className="h-3 w-3" />
                        {currentUser.points} pts
                      </Badge>
                      <Badge variant="outline" className="gap-1 border-orange-400 text-orange-600">
                        <Flame className="h-3 w-3" />
                        {currentUser.current_streak} day streak
                      </Badge>
                    </div>
                  </div>
                </div>
                <Link href="/stats">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-amber-500">
                    View Details
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-blue-500" />
                  Top Performers
                </CardTitle>
                <CardDescription>The most engaged members of the community</CardDescription>
              </div>
              <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <TabsList>
                  <TabsTrigger value="weekly">This Week</TabsTrigger>
                  <TabsTrigger value="monthly">This Month</TabsTrigger>
                  <TabsTrigger value="all_time">All Time</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboardData.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer ${
                      user.rank === 1
                        ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-300 dark:border-yellow-700'
                        : user.rank === 2
                        ? 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-gray-300 dark:border-gray-700'
                        : user.rank === 3
                        ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-300 dark:border-amber-700'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-12">
                      {getRankIcon(user.rank)}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-14 w-14 ring-2 ring-white dark:ring-gray-800">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className={`text-lg ${
                        user.rank <= 3 ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' : 'bg-gray-300'
                      }`}>
                        {user.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-lg truncate">{user.username}</h4>
                        {user.current_streak >= 7 && (
                          <Badge variant="outline" className="border-orange-400 text-orange-600 gap-1">
                            <Flame className="h-3 w-3" />
                            {user.current_streak}
                          </Badge>
                        )}
                        {user.rank <= 3 && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            Top {user.rank}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          <strong className="text-foreground">{user.points}</strong> points
                        </span>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <strong className="text-foreground">{user.engagement_generated}</strong> engagement
                        </span>
                      </div>
                    </div>

                    {/* Level Badge */}
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">Level</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.floor(user.points / 100)}
                      </div>
                    </div>
                  </div>
                ))}

                {leaderboardData.length === 0 && (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No rankings yet</h3>
                    <p className="text-muted-foreground">Be the first to start engaging!</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How Points Work */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              How to Climb the Leaderboard
            </CardTitle>
            <CardDescription>Earn points through authentic engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { action: 'Daily Login', points: 5, icon: '📅', color: 'from-blue-500 to-cyan-500' },
                { action: 'Receive a Like', points: 2, icon: '❤️', color: 'from-pink-500 to-rose-500' },
                { action: 'Receive a Comment', points: 3, icon: '💬', color: 'from-purple-500 to-indigo-500' },
                { action: 'Get Shared', points: 5, icon: '🔄', color: 'from-green-500 to-emerald-500' },
                { action: '7-Day Streak', points: 50, icon: '🔥', color: 'from-orange-500 to-red-500' },
                { action: '30-Day Streak', points: 200, icon: '💎', color: 'from-yellow-500 to-amber-500' },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-xl bg-gradient-to-br ${item.color} text-white`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{item.icon}</span>
                    <Badge className="bg-white/20 text-white border-white/30">
                      +{item.points} pts
                    </Badge>
                  </div>
                  <p className="font-semibold">{item.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}