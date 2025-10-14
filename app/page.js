'use client';

import { useState, useEffect } from 'react';
import { Trophy, Flame, Crown, Medal, TrendingUp, Zap, ChevronRight, Sparkles, Award, MessageSquare, MessageCircle, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function CommunityLeaderboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('all_time');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [prizePool, setPrizePool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

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
    if (rank === 1) return <Crown className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />;
    if (rank === 2) return <Medal className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 md:h-5 md:w-5 text-amber-700" />;
    return <span className="text-xs md:text-sm font-semibold text-gray-500">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-[#FCF6F5] dark:bg-[#141212]">
      {/* Header */}
      <header className="bg-white/90 dark:bg-[#141212]/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="bg-[#FA4616] p-2 md:p-2.5 rounded-xl md:rounded-2xl">
                <Trophy className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white">
                  Leaderboard
                </h1>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Compete & earn rewards</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Link href="/stats">
                <Button variant="ghost" className="gap-1 md:gap-2 text-gray-700 dark:text-gray-300 text-xs md:text-sm px-2 md:px-4">
                  <span className="hidden sm:inline">My Stats</span>
                  <span className="sm:hidden">Stats</span>
                  <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </Link>
              <Link href="/admin">
                <Button className="bg-[#FA4616] hover:bg-[#FA4616]/90 text-white text-xs md:text-sm px-2 md:px-4">
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-6xl">
        {/* Prize Pool Banner */}
        {prizePool && (
          <Card className="mb-6 md:mb-8 border-0 bg-gradient-to-br from-[#141212] to-gray-800 dark:from-[#FA4616] dark:to-orange-700 text-white shadow-xl">
            <CardContent className="py-5 md:py-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-6 w-full sm:w-auto">
                  <div className="bg-white/10 p-3 md:p-5 rounded-2xl md:rounded-3xl backdrop-blur-sm flex-shrink-0">
                    <Trophy className="h-6 w-6 md:h-10 md:w-10" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-2xl md:text-4xl font-bold mb-1 truncate">
                      ${prizePool.amount} Prize Pool
                    </div>
                    <p className="text-white/70 text-xs md:text-base">
                      Ends {new Date(prizePool.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · Top 10 win
                    </p>
                  </div>
                </div>
                <Badge className="bg-white/20 text-white border-0 text-sm md:text-base px-4 md:px-5 py-1.5 md:py-2 backdrop-blur-sm self-start sm:self-auto">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card className="border-0 shadow-lg bg-white dark:bg-gray-950">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 px-4 md:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
              <div>
                <CardTitle className="text-xl md:text-2xl font-semibold flex items-center gap-2 md:gap-3 text-gray-900 dark:text-white">
                  <Trophy className="h-5 w-5 md:h-6 md:w-6" />
                  Top Performers
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">Most engaged members</CardDescription>
              </div>
              <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="w-full sm:w-auto">
                <TabsList className="bg-gray-100 dark:bg-gray-800 border-0 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
                  <TabsTrigger value="weekly" className="data-[state=active]:bg-[#FA4616] data-[state=active]:text-white text-xs md:text-sm">Week</TabsTrigger>
                  <TabsTrigger value="monthly" className="data-[state=active]:bg-[#FA4616] data-[state=active]:text-white text-xs md:text-sm">Month</TabsTrigger>
                  <TabsTrigger value="all_time" className="data-[state=active]:bg-[#FA4616] data-[state=active]:text-white text-xs md:text-sm">All</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12 md:py-16">
                <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-[#FA4616]"></div>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {leaderboardData.slice(0, showAll ? 10 : 5).map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-2 md:gap-5 p-3 md:p-5 rounded-xl md:rounded-2xl transition-all hover:scale-[1.01] cursor-pointer ${
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
                    <div className="flex items-center justify-center w-6 md:w-10 flex-shrink-0">
                      {getRankIcon(user.rank)}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-10 w-10 md:h-14 md:w-14 ring-2 ring-white dark:ring-gray-950 flex-shrink-0">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className={`text-xs md:text-base font-semibold ${
                        user.rank <= 3 ? 'bg-[#FA4616] text-white' : 'bg-gray-300 dark:bg-gray-700'
                      }`}>
                        {user.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1">
                        <h4 className="font-semibold text-sm md:text-base truncate text-gray-900 dark:text-white">{user.username}</h4>
                        {user.current_streak >= 7 && (
                          <Badge variant="outline" className="border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 gap-1 bg-orange-50 dark:bg-orange-950/30 text-xs px-1.5 py-0">
                            <Flame className="h-2.5 w-2.5 md:h-3 md:w-3" />
                            <span className="hidden sm:inline">{user.current_streak}</span>
                          </Badge>
                        )}
                        {user.rank <= 3 && (
                          <Badge className="bg-[#FA4616] text-white border-0 text-xs px-1.5 py-0 hidden sm:inline-flex">
                            Top {user.rank}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          <strong className="text-gray-900 dark:text-white">{user.points}</strong>
                          <span className="hidden sm:inline">pts</span>
                        </span>
                        <Separator orientation="vertical" className="h-3 md:h-4 hidden sm:block" />
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          <strong className="text-gray-900 dark:text-white">{user.engagement_generated}</strong>
                          <span className="hidden sm:inline">eng</span>
                        </span>
                      </div>
                    </div>

                    {/* Level */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 hidden md:block">Level</div>
                      <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        {Math.floor(user.points / 100)}
                      </div>
                    </div>
                  </div>
                ))}

                {leaderboardData.length === 0 && (
                  <div className="text-center py-12 md:py-16">
                    <Trophy className="h-12 w-12 md:h-16 md:w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-base md:text-lg font-semibold mb-2 text-gray-900 dark:text-white">No rankings yet</h3>
                    <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Be the first to start engaging!</p>
                  </div>
                )}

                {/* Show More/Less Button */}
                {leaderboardData.length > 5 && (
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAll(!showAll)}
                      className="w-full flex items-center justify-center gap-2 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      {showAll ? (
                        <>
                          <ChevronRight className="h-4 w-4 rotate-90" />
                          Show Less
                        </>
                      ) : (
                        <>
                          View Top 10
                          <ChevronRight className="h-4 w-4 -rotate-90" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Rank Card - Below Leaderboard */}
        {currentUser && (
          <Card className="mt-6 md:mt-8 border-0 shadow-lg bg-white dark:bg-gray-950">
            <CardContent className="py-5 md:py-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-6 w-full sm:w-auto">
                  <Avatar className="h-14 w-14 md:h-20 md:w-20 ring-4 ring-gray-100 dark:ring-gray-800 flex-shrink-0">
                    <AvatarImage src={currentUser.avatar_url} />
                    <AvatarFallback className="bg-[#FA4616] text-white text-lg md:text-2xl font-semibold">
                      {currentUser.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-1">Your Current Rank</p>
                    <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">#{currentUser.rank}</h3>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <Badge variant="secondary" className="gap-1 md:gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-0 text-xs">
                        <Zap className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        {currentUser.points} pts
                      </Badge>
                      <Badge variant="outline" className="gap-1 md:gap-1.5 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 text-xs">
                        <Flame className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        {currentUser.current_streak} day
                      </Badge>
                    </div>
                  </div>
                </div>
                <Link href="/stats" className="w-full sm:w-auto">
                  <Button size="lg" className="bg-[#FA4616] hover:bg-[#FA4616]/90 text-white w-full sm:w-auto text-sm md:text-base">
                    View Details
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Level System */}
        <Card className="mt-6 md:mt-8 border-0 shadow-lg bg-white dark:bg-gray-950">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 px-4 md:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 md:gap-3 text-gray-900 dark:text-white text-base md:text-xl">
                  <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
                  Level System
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">Climb through 10 levels based on engagement received</CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FA4616]/10 border border-[#FA4616]/20">
                  <span className="text-2xl">👁️</span>
                  <div className="text-left">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Forum Views</p>
                    <p className="text-sm font-bold text-[#FA4616]">0.1 pts each</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                  <span className="text-2xl">💬</span>
                  <div className="text-left">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Replies Received</p>
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400">1 pt each</p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {[
                { level: 1, points: 0, icon: '🌱', name: 'Level 1' },
                { level: 2, points: 5, icon: '🙂', name: 'Level 2' },
                { level: 3, points: 20, icon: '👍', name: 'Level 3' },
                { level: 4, points: 65, icon: '🌟', name: 'Level 4' },
                { level: 5, points: 155, icon: '⚡', name: 'Level 5' },
                { level: 6, points: 515, icon: '🔥', name: 'Level 6' },
                { level: 7, points: 2015, icon: '💎', name: 'Level 7' },
                { level: 8, points: 8015, icon: '👑', name: 'Level 8' },
                { level: 9, points: 33015, icon: '🏆', name: 'Level 9' },
                { level: 10, points: 100000, icon: '⭐', name: 'Level 10' },
              ].map((item) => (
                <div key={item.level} className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 border border-gray-200 dark:border-gray-800 hover:border-[#FA4616] transition-colors">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl mb-2">{item.icon}</div>
                    <Badge className="bg-[#FA4616] text-white border-0 text-xs mb-2">
                      Lvl {item.level}
                    </Badge>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.points.toLocaleString()} pts
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <Separator className="my-6 bg-gray-200 dark:bg-gray-800" />
            
            {/* How Points Work */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-900">
                <div className="flex items-start gap-3">
                  <div className="bg-[#FA4616] p-2 rounded-lg flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                      Forum Posts (Main Points)
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Earn points when others engage with your content
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">0.1 point per view (min 5 views)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">1 point per reply received</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">10 point bonus for pinned posts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-900">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-600 p-2 rounded-lg flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                      Chat Messages (Light Tracking)
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Stay active in discussions
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">0.5 points per reply received</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 dark:text-blue-400">ℹ</span>
                        <span className="text-gray-700 dark:text-gray-300">Great for staying active!</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Anti-Spam Note */}
            <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                    Quality Over Quantity
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Spam filters active: Posts need 10+ characters, 5+ views to count. Self-replies and instant replies don't count. Create valuable content that others want to engage with!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 p-2 rounded-lg flex-shrink-0">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                    Custom Level Names
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Community admins can personalize level titles (e.g., "Newbie" → "The GOAT")
                  </p>
                </div>
              </div>
              <Link href="/admin" className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full sm:w-auto border-blue-300 dark:border-blue-800">
                  View Admin Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}