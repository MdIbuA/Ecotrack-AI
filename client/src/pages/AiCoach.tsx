import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCpu, FiRefreshCw, FiZap, FiAward } from 'react-icons/fi';
import Layout from '../components/layout/Layout.js';
import Card from '../components/ui/Card.js';
import Button from '../components/ui/Button.js';
import Badge from '../components/ui/Badge.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.js';
import { apiService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface RecommendationItem {
  title: string;
  description: string;
  category: 'transportation' | 'energy' | 'food' | 'waste';
  impactScore: 'low' | 'medium' | 'high';
  difficultyScore: 'easy' | 'medium' | 'hard';
  potentialAnnualReductionKg: number;
  estimatedSavingsUsd: number;
}

const defaultTips: RecommendationItem[] = [
  {
    title: 'Switch to Public Transit',
    description: 'Use the bus or train for your daily commute instead of driving solo. It reduces personal transit greenhouse gases significantly.',
    category: 'transportation',
    impactScore: 'high',
    difficultyScore: 'medium',
    potentialAnnualReductionKg: 1200,
    estimatedSavingsUsd: 800,
  },
  {
    title: 'Install LED Lighting',
    description: 'Replace standard incandescent bulbs with energy-efficient LED alternatives. They consume up to 80% less power.',
    category: 'energy',
    impactScore: 'medium',
    difficultyScore: 'easy',
    potentialAnnualReductionKg: 400,
    estimatedSavingsUsd: 150,
  },
  {
    title: 'Reduce Red Meat Consumption',
    description: 'Substitute beef and pork with healthy plant proteins. Animal farming contributes high methane levels.',
    category: 'food',
    impactScore: 'high',
    difficultyScore: 'medium',
    potentialAnnualReductionKg: 800,
    estimatedSavingsUsd: 500,
  },
  {
    title: 'Organic Food Waste Compost',
    description: 'Start composting organic food scraps rather than tossing them in standard trash bins. Landfill decay produces methane gases.',
    category: 'waste',
    impactScore: 'medium',
    difficultyScore: 'easy',
    potentialAnnualReductionKg: 300,
    estimatedSavingsUsd: 100,
  },
  {
    title: 'Smart Thermostat Integration',
    description: 'Install a smart thermostat to optimize heating and cooling schedules based on when you are home.',
    category: 'energy',
    impactScore: 'high',
    difficultyScore: 'medium',
    potentialAnnualReductionKg: 600,
    estimatedSavingsUsd: 250,
  },
];

export default function AiCoach() {
  const { user } = useAuth();
  const [tips, setTips] = useState<RecommendationItem[]>(defaultTips);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAiTips = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const token = user.getIdToken ? await user.getIdToken() : 'mock-token';
      const response = await apiService.getRecommendations(token);
      if (response && response.success && response.recommendations) {
        setTips(response.recommendations);
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to Gemini API to refresh custom suggestions. Showing standard tips.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-primary-950 via-dark-900 to-primary-900 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden shadow-xl border border-primary-500/10">
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
          
          <div className="max-w-xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-xs font-semibold">
              <FiCpu /> Powered by Gemini AI
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold font-display leading-tight">
              AI Sustainability Coach
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your personal assistant analyzes daily carbon entries, transportation, diet, and electricity habits to recommend actionable reduction milestones.
            </p>
            <div className="pt-2">
              <Button
                onClick={fetchAiTips}
                variant="primary"
                loading={loading}
                icon={<FiRefreshCw className={loading ? 'animate-spin' : ''} />}
              >
                Analyze & Generate Custom Tips
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-4">
            <LoadingSpinner size="lg" label="Analyzing carbon footprint trends with Gemini..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.map((tip, idx) => (
              <Card key={idx} className="flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <Badge
                      variant={
                        tip.category === 'transportation'
                          ? 'success'
                          : tip.category === 'energy'
                          ? 'info'
                          : tip.category === 'food'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {tip.category}
                    </Badge>
                    
                    <div className="flex gap-1">
                      <Badge variant={tip.impactScore === 'high' ? 'danger' : 'default'} size="sm">
                        {tip.impactScore} Impact
                      </Badge>
                      <Badge variant="default" size="sm">
                        {tip.difficultyScore}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">{tip.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-dark-400 mt-2 leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-dark-800 text-center">
                  <div className="bg-primary-500/5 dark:bg-primary-500/10 p-2 rounded-xl">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-dark-400 font-bold">Annual Reduction</p>
                    <p className="text-base font-extrabold text-primary-500 mt-0.5">
                      {tip.potentialAnnualReductionKg} kg CO₂
                    </p>
                  </div>
                  <div className="bg-accent-500/5 dark:bg-accent-500/10 p-2 rounded-xl">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-dark-400 font-bold">Est. Financial Savings</p>
                    <p className="text-base font-extrabold text-accent-500 mt-0.5">
                      ${tip.estimatedSavingsUsd}/yr
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
