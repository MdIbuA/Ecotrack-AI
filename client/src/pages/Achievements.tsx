import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiStar, FiZap, FiCheck } from 'react-icons/fi';
import Layout from '../components/layout/Layout.js';
import Card from '../components/ui/Card.js';
import Badge from '../components/ui/Badge.js';
import ProgressBar from '../components/ui/ProgressBar.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.js';
import { apiService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface LeaderboardItem {
  name: string;
  points: number;
  level: number;
  isSelf: boolean;
}

interface GamificationStats {
  ecoPoints: number;
  streak: number;
  level: number;
  levelTitle: string;
  levelProgressPercent: number;
  nextLevelMinPoints: number;
  badges: BadgeItem[];
  leaderboard: LeaderboardItem[];
}

export default function Achievements() {
  const { user } = useAuth();
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAchievements() {
      if (!user) return;
      try {
        setLoading(true);
        const token = user.getIdToken ? await user.getIdToken() : 'mock-token';
        const response = await apiService.getAchievements(token);
        if (response && response.success && response.gamification) {
          setStats(response.gamification);
        }
      } catch (err: any) {
        console.error(err);
        setError('Failed to fetch gamification details');
      } finally {
        setLoading(false);
      }
    }
    loadAchievements();
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="py-16 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner size="lg" label="Loading achievements & leaderboard..." />
        </div>
      </Layout>
    );
  }

  if (error || !stats) {
    return (
      <Layout>
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm">
          {error || 'Could not load gamification statistics.'}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiAward className="text-primary-500" />
            Achievements & Gamification
          </h1>
          <p className="text-gray-500 dark:text-dark-400 mt-1">
            Build streaks, earn points, and unlock sustainability badges
          </p>
        </div>

        {/* Level Overview Banner */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          <Card variant="gradient" className="md:col-span-8 bg-gradient-to-br from-primary-950 via-dark-900 to-primary-900 text-white border border-primary-500/10 flex flex-col justify-between p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-wider text-primary-300 font-bold">Level {stats.level}</span>
                  <h2 className="text-2xl lg:text-3xl font-black">{stats.levelTitle}</h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary-500/20 flex items-center justify-center text-2xl border border-primary-500/30">
                  🏆
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-300 font-medium">
                  <span>Progress to Next Level</span>
                  <span>{stats.ecoPoints} / {stats.nextLevelMinPoints} XP</span>
                </div>
                <ProgressBar value={stats.levelProgressPercent} color="primary" animated />
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-6 leading-relaxed">
              Earn Eco Points by logging carbon calculations, keeping streaks alive, and meeting carbon reduction goals.
            </p>
          </Card>

          {/* Quick Metrics */}
          <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-1 gap-4">
            <Card variant="glass" className="flex flex-col justify-between py-5 px-6">
              <div className="flex justify-between items-center text-gray-500 dark:text-dark-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Points</span>
                <FiStar className="text-amber-500 w-5 h-5" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">
                  {stats.ecoPoints.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 block mt-1">Eco Points</span>
              </div>
            </Card>

            <Card variant="glass" className="flex flex-col justify-between py-5 px-6">
              <div className="flex justify-between items-center text-gray-500 dark:text-dark-400">
                <span className="text-xs font-bold uppercase tracking-wider">Active Streak</span>
                <FiZap className="text-amber-500 w-5 h-5 fill-amber-500/20" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">
                  {stats.streak}
                </span>
                <span className="text-xs text-gray-500 block mt-1">Days Active</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Badges Grid & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Badge List */}
          <div className="lg:col-span-8">
            <Card variant="glass">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Unlocked Badges</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {stats.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`flex flex-col items-center justify-between p-4 rounded-2xl border text-center transition-all duration-300 relative ${
                      badge.unlocked
                        ? 'border-primary-500/20 bg-primary-500/5 dark:bg-primary-500/10'
                        : 'border-gray-200 dark:border-dark-800 bg-gray-50/50 dark:bg-dark-900/20 filter grayscale opacity-45'
                    }`}
                  >
                    {badge.unlocked && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center text-white text-[10px]">
                        <FiCheck />
                      </div>
                    )}
                    <span className="text-3xl filter drop-shadow">{badge.icon}</span>
                    <div className="mt-3">
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-snug">{badge.title}</p>
                      <p className="text-[10px] text-gray-500 dark:text-dark-400 mt-1 max-w-[120px] mx-auto leading-tight">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* simulated community leaderboard */}
          <div className="lg:col-span-4">
            <Card variant="glass">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Eco Leaderboard</h3>
              
              <div className="space-y-3">
                {stats.leaderboard.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      item.isSelf
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-gray-100 dark:border-dark-800 bg-white/5'
                    }`}
                  >
                    <div className="w-6 text-center text-sm font-black text-gray-400">
                      {index + 1}
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xs">
                      {item.name[0].toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-dark-400">
                        Level {item.level}
                      </p>
                    </div>
                    
                    <div className="text-right text-xs font-extrabold text-primary-500">
                      {item.points.toLocaleString()} XP
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
