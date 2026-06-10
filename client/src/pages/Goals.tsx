import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiTarget, FiPlus, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import Layout from '../components/layout/Layout.js';
import Card from '../components/ui/Card.js';
import Button from '../components/ui/Button.js';
import Input from '../components/ui/Input.js';
import Badge from '../components/ui/Badge.js';
import ProgressBar from '../components/ui/ProgressBar.js';
import Modal from '../components/ui/Modal.js';
import { useCarbon } from '../context/CarbonContext.js';

export default function Goals() {
  const { goals, createGoal, updateGoal, deleteGoal, loading } = useCarbon();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [category, setCategory] = useState<'transportation' | 'energy' | 'food' | 'waste' | 'overall'>('overall');
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [unit, setUnit] = useState('kg CO₂');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState('');

  const filteredGoals = useMemo(() => goals.filter((g) => g.status === activeTab), [goals, activeTab]);

  const { activeCount, completedCount } = useMemo(() => {
    let active = 0;
    let completed = 0;
    goals.forEach((g) => {
      if (g.status === 'active') active++;
      else if (g.status === 'completed') completed++;
    });
    return { activeCount: active, completedCount: completed };
  }, [goals]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      if (!title || targetValue <= 0 || !targetDate) {
        throw new Error('Please fill in all required fields');
      }

      await createGoal({
        category,
        title,
        targetValue,
        currentValue,
        unit,
        startDate,
        targetDate,
      });

      setIsOpen(false);
      // Reset form
      setTitle('');
      setTargetValue(0);
      setCurrentValue(0);
      setTargetDate('');
    } catch (err: any) {
      setError(err.message || 'Failed to create goal');
    }
  };

  const handleIncrement = async (goal: any) => {
    const newVal = Math.min(goal.currentValue + 10, goal.targetValue);
    await updateGoal(goal.id, { currentValue: newVal });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this goal?')) {
      await deleteGoal(id);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FiTarget className="text-primary-500" />
              Sustainability Goals
            </h1>
            <p className="text-gray-500 dark:text-dark-400 mt-1">
              Set goals to reduce your daily carbon footprint
            </p>
          </div>
          <Button onClick={() => setIsOpen(true)} variant="primary" icon={<FiPlus />}>
            Create Goal
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-dark-800">
          {(['active', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-all capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab} Goals ({tab === 'active' ? activeCount : completedCount})
            </button>
          ))}
        </div>

        {/* Goals List */}
        {filteredGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredGoals.map((goal) => {
              const progress = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
              
              return (
                <Card key={goal.id} className="relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{goal.title}</h3>
                      <div className="flex gap-2 mt-2">
                        <Badge
                          variant={
                            goal.category === 'transportation'
                              ? 'success'
                              : goal.category === 'energy'
                              ? 'info'
                              : goal.category === 'food'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {goal.category}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-dark-400 font-medium">
                          Due {new Date(goal.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      title="Delete Goal"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 mt-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </span>
                    </div>

                    <ProgressBar
                      value={progress}
                      color={progress >= 80 ? 'primary' : progress >= 50 ? 'accent' : 'warning'}
                      showPercentage
                      animated
                    />

                    {goal.status === 'active' && (
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleIncrement(goal)}
                        >
                          +10 Log Progress
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-900 flex items-center justify-center mx-auto text-2xl mb-4">
              🎯
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No {activeTab} goals found</h3>
            <p className="text-gray-500 dark:text-dark-400 text-sm mt-1 mb-4">
              {activeTab === 'active'
                ? "You don't have any carbon reduction goals right now."
                : "No completed goals logged in your records."}
            </p>
            {activeTab === 'active' && (
              <Button onClick={() => setIsOpen(true)} variant="primary">
                Create First Goal
              </Button>
            )}
          </div>
        )}

        {/* Create Goal Modal */}
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Carbon Reduction Goal">
          <form onSubmit={handleCreateGoal} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-dark-300">Category</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="overall">Overall Reduction</option>
                <option value="transportation">Transportation</option>
                <option value="energy">Home Energy</option>
                <option value="food">Dietary Footprint</option>
                <option value="waste">Waste Management</option>
              </select>
            </div>

            <Input
              label="Goal Title"
              placeholder="e.g. Reduce weekly driving by 20km"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Target Value"
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(Math.max(0, Number(e.target.value)))}
                required
              />
              <Input
                label="Measurement Unit"
                placeholder="e.g. km, kg CO₂, meals"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
              />
            </div>

            <Input
              label="Target Deadline"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-800">
              <Button onClick={() => setIsOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={loading}>
                Save Goal
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
