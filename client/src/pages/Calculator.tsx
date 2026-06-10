import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlusCircle, FiArrowLeft, FiArrowRight, FiCheck } from 'react-icons/fi';
import Layout from '../components/layout/Layout.js';
import Card from '../components/ui/Card.js';
import Button from '../components/ui/Button.js';
import Input from '../components/ui/Input.js';
import Badge from '../components/ui/Badge.js';
import ProgressBar from '../components/ui/ProgressBar.js';
import { useCarbon } from '../context/CarbonContext.js';

export default function Calculator() {
  const navigate = useNavigate();
  const { createEntry, loading } = useCarbon();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Transportation State
  const [carKm, setCarKm] = useState(0);
  const [bikeKm, setBikeKm] = useState(0);
  const [busKm, setBusKm] = useState(0);
  const [trainKm, setTrainKm] = useState(0);
  const [flightHours, setFlightHours] = useState(0);

  // Energy State
  const [electricityKwh, setElectricityKwh] = useState(0);
  const [acHours, setAcHours] = useState(0);
  const [applianceFactor, setApplianceFactor] = useState<'low' | 'medium' | 'high'>('medium');

  // Food State
  const [dietType, setDietType] = useState<'vegan' | 'vegetarian' | 'omnivore'>('omnivore');

  // Waste State
  const [plasticBagCount, setPlasticBagCount] = useState(0);
  const [foodWasteKg, setFoodWasteKg] = useState(0);
  const [recyclingRate, setRecyclingRate] = useState(0);

  // Quick estimation constants
  const estCar = carKm * 0.21;
  const estBus = busKm * 0.089;
  const estTrain = trainKm * 0.041;
  const estFlight = flightHours * 250;
  const estTrans = estCar + estBus + estTrain + estFlight;

  const estElec = electricityKwh * 0.5;
  const estAc = acHours * 1.5;
  const estApp = applianceFactor === 'low' ? 0.5 : applianceFactor === 'high' ? 2.0 : 1.0;
  const estEnergy = estElec + estAc + estApp;

  const estFood = dietType === 'vegan' ? 2.89 : dietType === 'vegetarian' ? 3.81 : 7.19;

  const estPlastic = plasticBagCount * 0.033;
  const estFoodWaste = foodWasteKg * 2.5;
  const estWaste = (estPlastic + estFoodWaste) * (1 - recyclingRate / 100);

  const runningTotal = estTrans + estEnergy + estFood + estWaste;

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    try {
      setError('');
      const entryPayload = {
        date,
        transportation: { carKm, bikeKm, busKm, trainKm, flightHours },
        energy: { electricityKwh, acHours, applianceFactor },
        food: { dietType },
        waste: { plasticBagCount, foodWasteKg, recyclingRate }
      };

      const result = await createEntry(entryPayload);
      if (result) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit calculation entry');
    }
  };

  const stepsList = [
    { label: 'Date', desc: 'Logging period' },
    { label: 'Transport', desc: 'Travel habits' },
    { label: 'Energy', desc: 'Household usage' },
    { label: 'Diet', desc: 'Nutrition footprint' },
    { label: 'Waste', desc: 'Trash & recycling' },
    { label: 'Results', desc: 'Footprint summary' },
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Step Indicator */}
        <div className="flex justify-between items-center bg-white dark:bg-dark-900 px-6 py-4 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800 overflow-x-auto">
          {stepsList.map((s, idx) => {
            const stepNum = idx + 1;
            const isCompleted = step > stepNum;
            const isActive = step === stepNum;
            
            return (
              <div key={idx} className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary-500 text-white'
                      : isActive
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white ring-4 ring-primary-500/20'
                      : 'bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-dark-400'
                  }`}
                >
                  {isCompleted ? <FiCheck /> : stepNum}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{s.label}</p>
                  <p className="text-[10px] text-gray-500 dark:text-dark-400">{s.desc}</p>
                </div>
                {idx < stepsList.length - 1 && (
                  <div className={`h-[2px] w-4 sm:w-8 bg-gray-200 dark:bg-dark-800 ml-2 ${step > stepNum ? 'bg-primary-500' : ''}`} />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Live Running Total Counter */}
        <div className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Live Footprint Estimate</h4>
            <p className="text-xs text-gray-500 dark:text-dark-400">Total accumulated for this entry</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold gradient-text">{runningTotal.toFixed(2)}</span>
            <span className="text-xs text-gray-500 dark:text-dark-400 ml-1">kg CO₂</span>
          </div>
        </div>

        <Card variant="glass">
          <AnimatePresence mode="wait">
            {/* Step 1: Date */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-gray-100 dark:border-dark-800 pb-4 mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Entry Date</h2>
                  <p className="text-sm text-gray-500 dark:text-dark-400 mt-1">Specify which date you are tracking</p>
                </div>
                <Input
                  label="Entry Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </motion.div>
            )}

            {/* Step 2: Transportation */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-gray-100 dark:border-dark-800 pb-4 mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">🚗 Transportation</h2>
                  <p className="text-sm text-gray-500 dark:text-dark-400 mt-1">Record travel distances and modes</p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Car Travel (km)"
                    type="number"
                    value={carKm}
                    onChange={(e) => setCarKm(Math.max(0, Number(e.target.value)))}
                    placeholder="Enter km driven"
                  />
                  <Input
                    label="Bike Travel (km)"
                    type="number"
                    value={bikeKm}
                    onChange={(e) => setBikeKm(Math.max(0, Number(e.target.value)))}
                    placeholder="Enter km cycled"
                  />
                  <Input
                    label="Bus Travel (km)"
                    type="number"
                    value={busKm}
                    onChange={(e) => setBusKm(Math.max(0, Number(e.target.value)))}
                    placeholder="Enter km ridden on bus"
                  />
                  <Input
                    label="Train Travel (km)"
                    type="number"
                    value={trainKm}
                    onChange={(e) => setTrainKm(Math.max(0, Number(e.target.value)))}
                    placeholder="Enter km ridden on train"
                  />
                  <Input
                    label="Flight Duration (hours)"
                    type="number"
                    value={flightHours}
                    onChange={(e) => setFlightHours(Math.max(0, Number(e.target.value)))}
                    placeholder="Enter flight hours"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Home Energy */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-gray-100 dark:border-dark-800 pb-4 mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">⚡ Home Energy</h2>
                  <p className="text-sm text-gray-500 dark:text-dark-400 mt-1">Specify electricity and heating appliance factors</p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Electricity Consumption (kWh)"
                    type="number"
                    value={electricityKwh}
                    onChange={(e) => setElectricityKwh(Math.max(0, Number(e.target.value)))}
                    placeholder="Average daily/weekly consumption"
                  />
                  <Input
                    label="AC Run Duration (hours)"
                    type="number"
                    value={acHours}
                    onChange={(e) => setAcHours(Math.max(0, Number(e.target.value)))}
                    placeholder="Hours air conditioner was on"
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-dark-300">
                      General Appliance Density
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['low', 'medium', 'high'] as const).map((factor) => (
                        <button
                          key={factor}
                          type="button"
                          onClick={() => setApplianceFactor(factor)}
                          className={`p-3 rounded-xl border font-semibold text-sm transition-all text-center capitalize ${
                            applianceFactor === factor
                              ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400'
                              : 'border-gray-200 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-800'
                          }`}
                        >
                          {factor}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Food Habits */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-gray-100 dark:border-dark-800 pb-4 mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">🍽️ Dietary Footprint</h2>
                  <p className="text-sm text-gray-500 dark:text-dark-400 mt-1">Which dietary category reflects today's meals?</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {(['vegan', 'vegetarian', 'omnivore'] as const).map((diet) => (
                    <button
                      key={diet}
                      type="button"
                      onClick={() => setDietType(diet)}
                      className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                        dietType === diet
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-gray-200 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-800'
                      }`}
                    >
                      <div>
                        <span className="text-base font-bold text-gray-950 dark:text-white capitalize">
                          {diet === 'vegan' ? '🥬 Vegan' : diet === 'vegetarian' ? '🥗 Vegetarian' : '🍖 Omnivore'}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                          {diet === 'vegan'
                            ? 'Zero animal products, lowest greenhouse footprint'
                            : diet === 'vegetarian'
                            ? 'No meat, includes dairy and eggs'
                            : 'Meat and dairy heavy, standard footprint'}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-500">
                        {diet === 'vegan' ? '2.89' : diet === 'vegetarian' ? '3.81' : '7.19'} kg CO₂/day
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 5: Waste Generation */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="border-b border-gray-100 dark:border-dark-800 pb-4 mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">♻️ Waste & Recycling</h2>
                  <p className="text-sm text-gray-500 dark:text-dark-400 mt-1">Plastic bags, organic waste, and recycling offsets</p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Plastic Bags Used"
                    type="number"
                    value={plasticBagCount}
                    onChange={(e) => setPlasticBagCount(Math.max(0, Number(e.target.value)))}
                    placeholder="Single-use bags used"
                  />
                  <Input
                    label="Food Waste (kg)"
                    type="number"
                    value={foodWasteKg}
                    onChange={(e) => setFoodWasteKg(Math.max(0, Number(e.target.value)))}
                    placeholder="Discarded organic trash weight"
                  />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-300">
                        Recycling Percentage
                      </label>
                      <span className="text-sm text-primary-500 font-bold">{recyclingRate}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={recyclingRate}
                      onChange={(e) => setRecyclingRate(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-dark-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 6: Summary Results */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-gray-100 dark:border-dark-800 pb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">🎉 Carbon Analysis</h2>
                  <p className="text-sm text-gray-500 dark:text-dark-400 mt-1">Footprint estimate breakdown</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-dark-800">
                    <span className="text-sm font-semibold text-gray-500">🚗 Transportation</span>
                    <span className="text-sm font-bold text-gray-950 dark:text-white">{estTrans.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-dark-800">
                    <span className="text-sm font-semibold text-gray-500">⚡ Home Energy</span>
                    <span className="text-sm font-bold text-gray-950 dark:text-white">{estEnergy.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-dark-800">
                    <span className="text-sm font-semibold text-gray-500">🍽️ Diet & Nutrition</span>
                    <span className="text-sm font-bold text-gray-950 dark:text-white">{estFood.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-dark-800">
                    <span className="text-sm font-semibold text-gray-500">♻️ Waste & Trash</span>
                    <span className="text-sm font-bold text-gray-950 dark:text-white">{estWaste.toFixed(2)} kg</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-4 bg-primary-500/5 dark:bg-primary-500/10 px-4 rounded-xl">
                    <span className="text-base font-bold text-gray-900 dark:text-white">Total Carbon Emissions</span>
                    <span className="text-xl font-black text-primary-500">{runningTotal.toFixed(2)} kg CO₂</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100 dark:border-dark-800">
            {step > 1 ? (
              <Button onClick={handlePrev} variant="outline" icon={<FiArrowLeft />}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 6 ? (
              <Button onClick={handleNext} variant="primary">
                Next <FiArrowRight className="inline-block ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} variant="primary" loading={loading}>
                Save Log
              </Button>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
