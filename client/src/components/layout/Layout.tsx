import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiTarget, FiAward, FiFileText, FiUser, FiLogOut,
  FiMenu, FiX, FiSun, FiMoon, FiCpu, FiCamera, FiPlusCircle,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
  { to: '/calculator', icon: FiPlusCircle, label: 'Calculator' },
  { to: '/goals', icon: FiTarget, label: 'Goals' },
  { to: '/ai-coach', icon: FiCpu, label: 'AI Coach' },
  { to: '/receipt-scanner', icon: FiCamera, label: 'Scanner' },
  { to: '/reports', icon: FiFileText, label: 'Reports' },
  { to: '/profile', icon: FiUser, label: 'Profile' },
];

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg">
        Skip to main content
      </a>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 
          bg-white/80 dark:bg-dark-900/90 backdrop-blur-xl
          border-r border-gray-200 dark:border-dark-800
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-dark-800">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-lg">
              🌱
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">EcoTrack AI</h1>
              <p className="text-xs text-gray-500 dark:text-dark-400">Carbon Tracker</p>
            </div>
            <button
              className="ml-auto lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar menu"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'nav-link-active'
                      : 'text-gray-600 dark:text-dark-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
                end={item.to === '/dashboard'}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    <span {...(isActive ? { 'aria-current': 'page' as const } : {})}>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Bottom */}
          <div className="px-3 pb-4 space-y-2 border-t border-gray-200 dark:border-dark-800 pt-4">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-dark-400 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              aria-label="Sign out of your account"
            >
              <FiLogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/70 dark:bg-dark-900/70 backdrop-blur-xl border-b border-gray-200 dark:border-dark-800 px-4 lg:px-8 py-3" role="banner">
          <div className="flex items-center justify-between">
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-600 dark:text-dark-400"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 ml-auto">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-dark-400">
                  {user?.email || 'user@eco.com'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                {(user?.displayName || 'U')[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8" role="main" aria-label="Main content" id="main-content">
          <div className="max-w-7xl mx-auto gradient-mesh min-h-full rounded-2xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
