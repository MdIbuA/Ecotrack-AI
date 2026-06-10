import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiCamera, FiUploadCloud, FiTrash2, FiAward, FiCheckCircle } from 'react-icons/fi';
import Layout from '../components/layout/Layout.js';
import Card from '../components/ui/Card.js';
import Button from '../components/ui/Button.js';
import Badge from '../components/ui/Badge.js';
import ProgressBar from '../components/ui/ProgressBar.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.js';
import { apiService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface ScannedItem {
  name: string;
  carbonImpact: number;
  category: string;
  ecoRating: string;
}

interface ScanAnalysis {
  sustainabilityScore: number;
  totalCarbonImpact: number;
  items: ScannedItem[];
  tips: string[];
}

export default function ReceiptScanner() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<ScanAnalysis | null>(null);
  const [pointsAwarded, setPointsAwarded] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
      setAnalysis(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError('');
        setAnalysis(null);
      } else {
        setError('Please upload an image file (PNG, JPG, WEBP)');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
  };

  const handleScan = async () => {
    if (!selectedFile || !user) return;

    try {
      setLoading(true);
      setError('');
      const token = user.getIdToken ? await user.getIdToken() : 'mock-token';
      const response = await apiService.scanReceipt(token, selectedFile);
      if (response && response.success && response.analysis) {
        setAnalysis(response.analysis);
        setPointsAwarded(response.pointsAwarded || 75);
      } else {
        throw new Error('Failed to process receipt analysis');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Receipt scanner failed to run. Please check file formatting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiCamera className="text-primary-500" />
            AI Receipt Scanner
          </h1>
          <p className="text-gray-500 dark:text-dark-400 mt-1">
            Upload grocery receipts to analyze food sustainability and carbon footprints
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Upload and Preview Zone */}
          <div className="lg:col-span-5 space-y-4">
            <Card variant="glass">
              {!previewUrl ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-dark-700 rounded-2xl p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-500/5 transition-all duration-300 flex flex-col items-center justify-center space-y-3"
                >
                  <FiUploadCloud className="w-12 h-12 text-gray-400 dark:text-dark-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Drag and drop your receipt image
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                      Supports JPEG, PNG, WEBP up to 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" type="button">
                    Browse Files
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-dark-800 bg-gray-50 max-h-96 flex items-center justify-center">
                    <img src={previewUrl} alt="Receipt preview" className="object-contain max-h-96 w-full" />
                    <button
                      onClick={removeFile}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors shadow-lg"
                      title="Remove image"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Button
                    onClick={handleScan}
                    variant="primary"
                    loading={loading}
                    fullWidth
                    icon={<FiCamera />}
                  >
                    Scan & Estimate Impact
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Results Analysis */}
          <div className="lg:col-span-7">
            {loading ? (
              <Card variant="glass" className="h-64 flex flex-col items-center justify-center space-y-4">
                <LoadingSpinner size="lg" label="Gemini is reading your receipt..." />
              </Card>
            ) : analysis ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Score Summary Card */}
                <Card variant="gradient" className="bg-gradient-to-br from-primary-900 to-dark-900 text-white border border-primary-500/10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-xs font-semibold">
                        <FiAward /> Scanning Complete
                      </div>
                      <h2 className="text-2xl font-bold">Sustainability Overview</h2>
                      <p className="text-gray-300 text-sm">
                        You earned <span className="text-primary-400 font-extrabold">{pointsAwarded} Eco Points</span> for scanning!
                      </p>
                    </div>

                    <div className="flex gap-4 items-center bg-black/20 p-4 rounded-2xl">
                      <div className="text-center">
                        <span className="text-3xl font-black text-primary-400">{analysis.sustainabilityScore}</span>
                        <span className="text-xs text-gray-400 block">Eco Score</span>
                      </div>
                      <div className="w-[1px] h-10 bg-white/10" />
                      <div className="text-center">
                        <span className="text-3xl font-black text-accent-400">{analysis.totalCarbonImpact.toFixed(1)}</span>
                        <span className="text-xs text-gray-400 block">kg CO₂ Est</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Items List */}
                <Card variant="glass">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Purchased Items Analysis</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-dark-800 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5">Item Name</th>
                          <th className="py-2.5">Category</th>
                          <th className="py-2.5 text-right">CO₂ Impact</th>
                          <th className="py-2.5 text-right">Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                        {analysis.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 font-semibold text-gray-900 dark:text-white">{item.name}</td>
                            <td className="py-3 text-gray-500 dark:text-dark-400 capitalize">{item.category}</td>
                            <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">
                              {item.carbonImpact.toFixed(2)} kg
                            </td>
                            <td className="py-3 text-right">
                              <Badge
                                variant={
                                  ['A+', 'A', 'B+'].includes(item.ecoRating)
                                    ? 'success'
                                    : ['B', 'C'].includes(item.ecoRating)
                                    ? 'info'
                                    : 'danger'
                                }
                                size="sm"
                              >
                                {item.ecoRating}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* AI Tips */}
                <Card variant="glass">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Greener Shopping Tips</h3>
                  <ul className="space-y-3">
                    {analysis.tips.map((tip, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-gray-600 dark:text-dark-300">
                        <FiCheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ) : (
              <Card variant="glass" className="h-64 flex flex-col items-center justify-center text-center p-6 border-dashed border-gray-300 dark:border-dark-700">
                <p className="text-gray-400 text-2xl">📸</p>
                <h3 className="text-md font-bold text-gray-900 dark:text-white mt-3">Ready for Receipt Upload</h3>
                <p className="text-sm text-gray-500 dark:text-dark-400 mt-1 max-w-sm">
                  Upload an image of your store receipt, and our Gemini Vision model will analyze the environmental impact of individual items.
                </p>
              </Card>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}
      </div>
    </Layout>
  );
}
