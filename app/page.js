'use client';

import { Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Root Page - Redirects to Whop Experience
 * 
 * This app is designed to run inside Whop's iframe.
 * Users should access it via: /experiences/[experienceId]
 * 
 * This page displays instructions for accessing the app correctly.
 */
export default function RootPage() {

  return (
    <div className="min-h-screen bg-[#FCF6F5] dark:bg-[#141212] flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full border-0 shadow-2xl bg-white dark:bg-gray-950">
        <CardHeader className="text-center pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-[#FA4616] to-orange-600 p-6 rounded-3xl shadow-lg">
              <Trophy className="h-16 w-16 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">
            Community Engagement Leaderboard
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
            This app runs inside Whop communities
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8 pb-8">
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                📱 How to Access
              </h3>
              <ol className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">1</span>
                  <span>Install this app in your Whop community</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">2</span>
                  <span>Open your community on Whop</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">3</span>
                  <span>Access the leaderboard from your community sidebar</span>
                </li>
              </ol>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-900 rounded-2xl p-6">
              <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">
                ✨ Features
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Real-time Leaderboard</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Track top performers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Points & Levels</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Skool-style progression</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Prize Pools</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Reward active members</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Daily Streaks</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Track consistency</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Note */}
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-2xl p-6">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                ⚠️ Local Preview Not Available
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                This app requires Whop's iframe SDK and authentication. It will only work when accessed through your Whop community, not in standalone mode.
              </p>
            </div>

            {/* CTA */}
            <div className="text-center pt-4">
              <a 
                href="https://whop.com/apps" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FA4616] to-orange-600 hover:from-[#FA4616]/90 hover:to-orange-600/90 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg transition-all hover:scale-105"
              >
                <Trophy className="h-5 w-5" />
                Visit Whop Marketplace
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}