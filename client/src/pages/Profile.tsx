import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiSettings, FiSun, FiMoon, FiDownload, FiTrash2 } from 'react-icons/fi';
import Layout from '../components/layout/Layout.js';
import Card from '../components/ui/Card.js';
import Button from '../components/ui/Button.js';
import Input from '../components/ui/Input.js';
import Badge from '../components/ui/Badge.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.js';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { apiService } from '../services/api.js';

export default function Profile() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [emailAlerts, setEmailAlerts] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        setLoading(true);
        const token = user.getIdToken ? await user.getIdToken() : 'mock-token';
        const response = await apiService.getProfile(token);
        if (response && response.success) {
          setProfile(response.profile);
          setDisplayName(response.profile.displayName || '');
          setPhotoURL(response.profile.photoURL || '');
        }
      } catch (err: any) {
        console.error(err);
        setError('Failed to load user profile data');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const token = user.getIdToken ? await user.getIdToken() : 'mock-token';
      const response = await apiService.updateProfile(token, { displayName, photoURL });
      if (response && response.success) {
        setSuccess('Profile updated successfully!');
        setProfile(response.profile);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(profile || {}, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'ecotrack-profile-export.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <Layout>
        <div className="py-16 flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner size="lg" label="Retrieving user settings..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiSettings className="text-primary-500" />
            Profile & Settings
          </h1>
          <p className="text-gray-500 dark:text-dark-400 mt-1">
            Manage your personal credentials, UI themes, and data parameters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Profile Overview Card */}
          <div className="md:col-span-4 space-y-4">
            <Card variant="glass" className="text-center p-6 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-extrabold text-3xl shadow-lg shadow-primary-500/25">
                {(displayName || 'U')[0].toUpperCase()}
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-4">{displayName}</h2>
              <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">{user?.email}</p>

              <div className="flex gap-2 mt-4">
                <Badge variant="success" size="sm">
                  Level {profile?.level || 1}
                </Badge>
                <Badge variant="info" size="sm">
                  {profile?.ecoPoints || 0} XP
                </Badge>
              </div>

              <div className="w-full h-[1px] bg-gray-100 dark:bg-dark-800 my-6" />

              <div className="w-full text-left space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Account Milestones</p>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-500">Streaks logged</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{profile?.streak || 1} days</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-500">Badges earned</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{(profile?.badges || []).length} unlocked</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Edit Form & settings */}
          <div className="md:col-span-8 space-y-6">
            <Card variant="glass">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Edit Profile details</h3>

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3 rounded-lg text-sm mb-4">
                  {success}
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <Input
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter full name"
                  required
                />
                
                <Input
                  label="Avatar Photo URL"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="Paste URL to image file"
                />

                <div className="pt-2">
                  <Button type="submit" variant="primary" loading={saving}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>

            {/* General Settings */}
            <Card variant="glass" className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">App Preferences</h3>

              {/* Theme Settings */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-dark-800">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Interface Theme</h4>
                  <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">Toggle between dark and light modes</p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-dark-800 bg-white/5 hover:bg-white/10 text-gray-700 dark:text-white transition-all shadow-sm"
                >
                  {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                </button>
              </div>

              {/* Unit Settings */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-dark-800">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Unit System</h4>
                  <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">Measurement units for distances and weight</p>
                </div>
                <div className="flex gap-2">
                  {(['metric', 'imperial'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setUnitSystem(unit)}
                      className={`px-3 py-1.5 rounded-lg border font-semibold text-xs capitalize transition-all ${
                        unitSystem === unit
                          ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400'
                          : 'border-gray-200 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-800'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data controls */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Manage Data</h4>
                  <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">Export profile variables or delete records</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleExportData} size="sm" variant="outline" icon={<FiDownload />}>
                    Export JSON
                  </Button>
                  <Button size="sm" variant="danger" icon={<FiTrash2 />}>
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
