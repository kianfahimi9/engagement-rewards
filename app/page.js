'use client';

import { useState, useEffect } from 'react';
import { Trophy, Flame, Crown, Award, TrendingUp, Users, DollarSign, Medal, Star, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function LeaderboardApp() {
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

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getStreakEmoji = (streak) => {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '💪';
    if (streak >= 7) return '⚡';
    return '🌟';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Engagement Leaderboard
                </h1>
                <p className="text-sm text-muted-foreground">Level up with every interaction!</p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Users className="h-4 w-4 mr-2" />
              My Stats
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - User Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current User Card */}
            <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple-500" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-4 ring-purple-200 dark:ring-purple-800">
                    <AvatarImage src={currentUser?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl">
                      {currentUser?.username?.slice(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{currentUser?.username || 'Guest User'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900">
                        Rank #{currentUser?.rank || '-'}
                      </Badge>
                      <Badge variant="outline" className="border-orange-300 text-orange-600">
                        Level {Math.floor((currentUser?.points || 0) / 100)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Points Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Points to Next Level</span>
                    <span className="font-bold text-purple-600">
                      {currentUser?.points || 0} / {Math.ceil(((currentUser?.points || 0) / 100) + 1) * 100}
                    </span>
                  </div>
                  <Progress 
                    value={((currentUser?.points || 0) % 100)} 
                    className="h-3 bg-purple-100 dark:bg-purple-900"
                  />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-xs font-medium text-muted-foreground">Streak</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold">{currentUser?.current_streak || 0}</span>
                      <span className="text-lg">{getStreakEmoji(currentUser?.current_streak || 0)}</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-xs font-medium text-muted-foreground">Engagement</span>
                    </div>
                    <p className="text-2xl font-bold">{currentUser?.engagement_generated || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prize Pool Card */}
            {prizePool && (
              <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Weekly Prize Pool
                  </CardTitle>
                  <CardDescription>Top performers share the rewards!</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      ${prizePool.amount}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ends {new Date(prizePool.period_end).toLocaleDateString()}
                    </p>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">🥇 1st Place</span>
                      <span className="font-bold">40%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">🥈 2nd Place</span>
                      <span className="font-bold">30%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">🥉 3rd Place</span>
                      <span className="font-bold">20%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">🎖️ 4th-10th</span>
                      <span className="font-bold">10%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-500" />
                  Recent Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: '🔥', name: 'Hot Streak', desc: '7 day streak' },
                    { icon: '💬', name: 'Chatterbox', desc: '100 comments' },
                    { icon: '⭐', name: 'Rising Star', desc: 'Top 10 rank' },
                  ].map((badge, i) => (
                    <div key={i} className="text-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border">
                      <div className="text-3xl mb-1">{badge.icon}</div>
                      <p className="text-xs font-medium">{badge.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Leaderboard */}
          <div className="lg:col-span-2">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Trophy className="h-6 w-6 text-purple-500" />
                      Leaderboard
                    </CardTitle>
                    <CardDescription>Compete with the best in your community</CardDescription>
                  </div>
                  <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <TabsList>
                      <TabsTrigger value="weekly">Week</TabsTrigger>
                      <TabsTrigger value="monthly">Month</TabsTrigger>
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
                    {leaderboardData.map((user, index) => (
                      <div
                        key={user.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
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
                        <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-800">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className={`${
                            user.rank <= 3 ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' : 'bg-gray-300'
                          }`}>
                            {user.username?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-lg truncate">{user.username}</h4>
                            {user.current_streak >= 7 && (
                              <Badge variant="outline" className="border-orange-400 text-orange-600">
                                <Flame className="h-3 w-3 mr-1" />
                                {user.current_streak}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {user.points} pts
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {user.engagement_generated} engagement
                            </span>
                          </div>
                        </div>

                        {/* Level Badge */}
                        <div className="text-right">
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            Level {Math.floor(user.points / 100)}
                          </Badge>
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

            {/* How to Earn Points */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  How to Earn Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { action: 'Daily Login', points: 5, icon: '📅' },
                    { action: 'Create a Post', points: 10, icon: '✍️' },
                    { action: 'Comment on Post', points: 5, icon: '💬' },
                    { action: 'Receive a Like', points: 2, icon: '❤️' },
                    { action: 'Receive a Comment', points: 3, icon: '💭' },
                    { action: '7-Day Streak Bonus', points: 50, icon: '🔥' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="font-medium">{item.action}</span>
                      </div>
                      <Badge className="bg-green-500">+{item.points} pts</Badge>
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