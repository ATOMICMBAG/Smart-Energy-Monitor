/**
 * SettingsPanel Component
 * Professional Settings mit Theme Switcher & View Modi
 * - Dark/Light Mode
 * - Compact/Main/Full View
 * - Tooltips Ein/Aus
 * - Professionelles Design für Premium-Produkt
 */

import { useState, useEffect } from 'react';

const SettingsPanel = ({ onThemeChange, onViewModeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [viewMode, setViewMode] = useState('main');
  const [showTooltips, setShowTooltips] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedViewMode = localStorage.getItem('viewMode') || 'main';
    const savedTooltips = localStorage.getItem('showTooltips') !== 'false';
    const savedAutoRefresh = localStorage.getItem('autoRefresh') !== 'false';

    setTheme(savedTheme);
    setViewMode(savedViewMode);
    setShowTooltips(savedTooltips);
    setAutoRefresh(savedAutoRefresh);

    // Apply theme
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    // Notify parent
    onThemeChange?.(savedTheme);
    onViewModeChange?.(savedViewMode);
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Sofort Dark Mode anwenden
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto mode - nutze System-Präferenz
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    onThemeChange?.(newTheme);
    
    // Force re-render durch kleine Verzögerung
    setTimeout(() => {
      console.log('Dark mode active:', document.documentElement.classList.contains('dark'));
    }, 100);
  };

  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    localStorage.setItem('viewMode', newMode);
    onViewModeChange?.(newMode);
  };

  const handleTooltipsToggle = () => {
    const newValue = !showTooltips;
    setShowTooltips(newValue);
    localStorage.setItem('showTooltips', newValue.toString());
  };

  const handleAutoRefreshToggle = () => {
    const newValue = !autoRefresh;
    setAutoRefresh(newValue);
    localStorage.setItem('autoRefresh', newValue.toString());
  };

  const resetSettings = () => {
    handleThemeChange('light');
    handleViewModeChange('main');
    setShowTooltips(true);
    setAutoRefresh(true);
    localStorage.setItem('showTooltips', 'true');
    localStorage.setItem('autoRefresh', 'true');
    localStorage.removeItem('onboarding_completed');
  };

  return (
    <>
      {/* Settings Button */}
      <button
        id="settings"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-6 z-30 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        title="Einstellungen"
      >
        <svg className={`w-6 h-6 text-gray-700 dark:text-gray-300 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings Panel Overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="fixed top-20 right-6 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-96 animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                ⚙️ Einstellungen
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Theme Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                🎨 Farbschema
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    theme === 'light'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-xs font-medium">Hell</span>
                  </div>
                </button>

                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span className="text-xs font-medium">Dunkel</span>
                  </div>
                </button>

                <button
                  onClick={() => handleThemeChange('auto')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    theme === 'auto'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-xs font-medium">Auto</span>
                  </div>
                </button>
              </div>
            </div>

            {/* View Mode Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                📐 Ansichtsmodus
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleViewModeChange('compact')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    viewMode === 'compact'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className="flex flex-col gap-0.5">
                        <div className="w-4 h-1 bg-current"></div>
                        <div className="w-4 h-1 bg-current"></div>
                        <div className="w-4 h-1 bg-current"></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium">Kompakt</span>
                  </div>
                </button>

                <button
                  onClick={() => handleViewModeChange('main')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    viewMode === 'main'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className="flex flex-col gap-1">
                        <div className="w-5 h-1.5 bg-current"></div>
                        <div className="w-5 h-1.5 bg-current"></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium">Standard</span>
                  </div>
                </button>

                <button
                  onClick={() => handleViewModeChange('full')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    viewMode === 'full'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className="flex flex-col gap-1">
                        <div className="w-6 h-2 bg-current"></div>
                        <div className="w-6 h-2 bg-current"></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium">Voll</span>
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {viewMode === 'compact' && 'Minimale Anzeige für Übersicht'}
                {viewMode === 'main' && 'Balance zwischen Detail und Übersicht'}
                {viewMode === 'full' && 'Maxima Details und Diagramme'}
              </p>
            </div>

            {/* Toggle Options */}
            <div className="space-y-4 mb-6">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tooltips anzeigen
                  </span>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition ${showTooltips ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showTooltips ? 'translate-x-6' : ''}`} onClick={handleTooltipsToggle}></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-Aktualisierung
                  </span>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition ${autoRefresh ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${autoRefresh ? 'translate-x-6' : ''}`} onClick={handleAutoRefreshToggle}></div>
                </div>
              </label>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetSettings}
              className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition"
            >
              🔄 Einstellungen zurücksetzen
            </button>

            {/* Info */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Smart Energy Monitor v1.0<br />
                Made with 💙 for jambit GmbH
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SettingsPanel;
