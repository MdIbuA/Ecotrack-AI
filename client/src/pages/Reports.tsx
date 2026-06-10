import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiFileText, FiPlus, FiArrowRight, FiAward } from 'react-icons/fi';
import Layout from '../components/layout/Layout.js';
import Card from '../components/ui/Card.js';
import Button from '../components/ui/Button.js';
import Badge from '../components/ui/Badge.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.js';
import { apiService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface ReportData {
  id: string;
  month: string;
  summary: string;
  insights: string[];
  totalEmissions: number;
  reductionProgress: number;
  generatedAt: string;
}

const mockReports: ReportData[] = [
  {
    id: 'report-1',
    month: '2026-05',
    summary: 'You made steady gains in May! Your total emissions fell by 8% compared to April, which was mainly achieved by reducing car travel distance by 45km and purchasing local food products.',
    insights: [
      'Car emissions reduced by 9.4 kg CO2 compared to April.',
      'Diet footprint remained constant with an average of 4.2 kg daily.',
      'Appliance usage was minimized, reducing home electricity by 15 kWh.'
    ],
    totalEmissions: 135.2,
    reductionProgress: 8,
    generatedAt: new Date(2026, 4, 30).toISOString()
  },
  {
    id: 'report-2',
    month: '2026-04',
    summary: 'In April, your carbon footprint decreased by 5% compared to March. There was a moderate reduction in waste generation, but flight hours contributed a significant temporary spike.',
    insights: [
      'Single-use plastic bag consumption dropped by 60%.',
      'One flight hour added a temporary spike of 250 kg CO2.',
      'Recycling rate reached 55%, mitigating approximately 6.5 kg CO2 waste.'
    ],
    totalEmissions: 147.8,
    reductionProgress: 5,
    generatedAt: new Date(2026, 3, 30).toISOString()
  }
];

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportData[]>(mockReports);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(mockReports[0]);

  const handleGenerateReport = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      setSelectedReport(null);
      
      const token = user.getIdToken ? await user.getIdToken() : 'mock-token';
      const response = await apiService.generateReport(token, selectedMonth);
      if (response && response.success && response.report) {
        const newReport = response.report;
        setReports((prev) => [newReport, ...prev]);
        setSelectedReport(newReport);
      }
    } catch (err: any) {
      console.error(err);
      setError('No carbon entries found for the selected month to compile an AI report.');
    } finally {
      setLoading(false);
    }
  }, [user, selectedMonth]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FiFileText className="text-primary-500" />
              Sustainability Reports
            </h1>
            <p className="text-gray-500 dark:text-dark-400 mt-1">
              Monthly carbon summaries and sustainability critiques
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 text-sm"
            />
            <Button onClick={handleGenerateReport} variant="primary" loading={loading} icon={<FiPlus />}>
              Generate AI Report
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <Card variant="glass" className="h-64 flex flex-col items-center justify-center space-y-4">
            <LoadingSpinner size="lg" label="Gemini is compiling your monthly carbon footprint trends..." />
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sidebar list */}
            <div className="lg:col-span-4 space-y-4">
              <Card variant="glass">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Past Reports</h3>
                {reports.length > 0 ? (
                  <div className="space-y-2">
                    {reports.map((report) => (
                      <button
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                          selectedReport?.id === report.id
                            ? 'border-primary-500 bg-primary-500/5 dark:bg-primary-500/10'
                            : 'border-gray-100 dark:border-dark-800 bg-white/5'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                            {new Date(report.month + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Logged: {report.totalEmissions.toFixed(1)} kg CO₂
                          </p>
                        </div>
                        <FiArrowRight className={`text-gray-400 transition-transform ${selectedReport?.id === report.id ? 'translate-x-1 text-primary-500' : ''}`} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-dark-400 text-center py-6">No reports generated yet</p>
                )}
              </Card>
            </div>

            {/* Detailed view */}
            <div className="lg:col-span-8">
              {selectedReport ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card variant="gradient" className="bg-gradient-to-br from-primary-950 via-dark-900 to-primary-900 text-white border border-primary-500/10">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-primary-300">Monthly Audit</span>
                        <h2 className="text-2xl font-black capitalize mt-1">
                          {new Date(selectedReport.month + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                      </div>
                      
                      <div className="flex gap-4 items-center bg-black/20 p-4 rounded-2xl">
                        <div className="text-center">
                          <span className="text-2xl font-black text-primary-400">-{selectedReport.reductionProgress}%</span>
                          <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Footprint reduction</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Summary paragraph */}
                  <Card variant="glass">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">AI Carbon Synthesis</h3>
                    <p className="text-sm text-gray-600 dark:text-dark-300 leading-relaxed font-medium">
                      {selectedReport.summary}
                    </p>
                  </Card>

                  {/* Bulleted Insights */}
                  <Card variant="glass">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Key Environmental Insights</h3>
                    <div className="space-y-4">
                      {selectedReport.insights.map((insight, index) => (
                        <div key={index} className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500 flex-shrink-0 text-xs font-bold mt-0.5">
                            {index + 1}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-dark-300 leading-relaxed">
                            {insight}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <Card variant="glass" className="h-64 flex flex-col items-center justify-center text-center p-6 border-dashed border-gray-300 dark:border-dark-700">
                  <p className="text-gray-400 text-2xl">📊</p>
                  <h3 className="text-md font-bold text-gray-900 dark:text-white mt-3">Select Report</h3>
                  <p className="text-sm text-gray-500 dark:text-dark-400 mt-1 max-w-sm">
                    Choose a report from the list on the left to inspect detailed sustainability critiques, or generate a new AI audit above.
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
