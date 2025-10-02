'use client';

import { useState, useEffect } from 'react';
import { Trophy, Flame, Crown, Medal, TrendingUp, Zap, ChevronRight, Sparkles } from 'lucide-react';
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
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-600" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-semibold text-gray-500">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-black dark:bg-white p-2.5 rounded-2xl">
                <Trophy className="h-6 w-6 text-white dark:text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Leaderboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Compete & earn rewards</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/stats">
                <Button variant="ghost" className="gap-2 text-gray-700 dark:text-gray-300">
                  My Stats
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/admin">
                <Button className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100">
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-6xl">
        {/* Prize Pool Banner */}
        {prizePool && (
          <Card className="mb-8 border-0 bg-gradient-to-br from-black to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-black shadow-xl">
            <CardContent className="py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="bg-white/10 dark:bg-black/10 p-5 rounded-3xl backdrop-blur-sm">
                    <Trophy className="h-10 w-10" />
                  </div>
                  <div>
                    <div className="text-4xl font-bold mb-1">
                      ${prizePool.amount} Prize Pool
                    </div>
                    <p className="text-white/70 dark:text-black/70">
                      Ends {new Date(prizePool.period_end).toLocaleDateString()} · Top 10 win
                    </p>
                  </div>
                </div>
                <Badge className="bg-white/20 dark:bg-black/20 text-white dark:text-black border-0 text-base px-5 py-2 backdrop-blur-sm">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Your Rank Card */}
        {currentUser && (
          <Card className="mb-8 border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardContent className="py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20 ring-4 ring-gray-100 dark:ring-gray-800">
                    <AvatarImage src={currentUser.avatar_url} />
                    <AvatarFallback className="bg-black dark:bg-white text-white dark:text-black text-2xl font-semibold">
                      {currentUser.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your Current Rank</p>
                    <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">#{currentUser.rank}</h3>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-0">
                        <Zap className="h-3.5 w-3.5" />
                        {currentUser.points} pts
                      </Badge>
                      <Badge variant="outline" className="gap-1.5 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30">
                        <Flame className="h-3.5 w-3.5" />
                        {currentUser.current_streak} day streak
                      </Badge>
                    </div>
                  </div>
                </div>
                <Link href="/stats">
                  <Button size="lg" className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100">
                    View Details
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold flex items-center gap-3 text-gray-900 dark:text-white">
                  <Trophy className="h-6 w-6" />
                  Top Performers
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">The most engaged community members</CardDescription>
              </div>
              <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <TabsList className="bg-gray-100 dark:bg-gray-800 border-0">
                  <TabsTrigger value="weekly" className="data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black">This Week</TabsTrigger>
                  <TabsTrigger value="monthly" className="data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black">This Month</TabsTrigger>
                  <TabsTrigger value="all_time" className="data-[state=active]:bg-black dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-black">All Time</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboardData.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-5 p-5 rounded-2xl transition-all hover:scale-[1.02] cursor-pointer ${
                      user.rank === 1
                        ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-2 border-yellow-200 dark:border-yellow-800'
                        : user.rank === 2
                        ? 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 border-2 border-gray-200 dark:border-gray-700'
                        : user.rank === 3
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-2 border-orange-200 dark:border-orange-800'
                        : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-10">
                      {getRankIcon(user.rank)}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-14 w-14 ring-2 ring-white dark:ring-gray-950">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className={`text-base font-semibold ${
                        user.rank <= 3 ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-300 dark:bg-gray-700'
                      }`}>
                        {user.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="font-semibold text-base truncate text-gray-900 dark:text-white">{user.username}</h4>
                        {user.current_streak >= 7 && (
                          <Badge variant="outline" className="border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 gap-1 bg-orange-50 dark:bg-orange-950/30">
                            <Flame className="h-3 w-3" />
                            {user.current_streak}
                          </Badge>
                        )}
                        {user.rank <= 3 && (
                          <Badge className="bg-black dark:bg-white text-white dark:text-black border-0">
                            Top {user.rank}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5" />
                          <strong className="text-gray-900 dark:text-white">{user.points}</strong> points
                        </span>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <strong className="text-gray-900 dark:text-white">{user.engagement_generated}</strong> engagement
                        </span>
                      </div>
                    </div>

                    {/* Level */}
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Level</div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {Math.floor(user.points / 100)}
                      </div>
                    </div>
                  </div>
                ))}

                {leaderboardData.length === 0 && (
                  <div className="text-center py-16">
                    <Trophy className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No rankings yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">Be the first to start engaging!</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How Points Work */}
        <Card className="mt-8 border-0 shadow-lg bg-white dark:bg-gray-950">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <Sparkles className="h-5 w-5" />
              How to Earn Points
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Climb the leaderboard through authentic engagement</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { action: 'Daily Login', points: 5, icon: '📅' },
                { action: 'Receive a Like', points: 2, icon: '❤️' },
                { action: 'Receive a Comment', points: 3, icon: '💬' },
                { action: 'Get Shared', points: 5, icon: '🔄' },
                { action: '7-Day Streak', points: 50, icon: '🔥' },
                { action: '30-Day Streak', points: 200, icon: '💎' },
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{item.icon}</span>
                    <Badge className="bg-black dark:bg-white text-white dark:text-black border-0">
                      +{item.points}
                    </Badge>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}