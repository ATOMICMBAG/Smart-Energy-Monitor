/**
 * OnboardingTour Component
 * Interaktive Einführung für neue User
 * - On-Demand aufrufen per Button
 * - Schrittweise Tour durch Features
 * - Kann übersprungen/deaktiviert werden
 */

import { useState, useEffect } from 'react';

const OnboardingTour = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  // Tour Steps Definition
  const steps = [
    {
      title: "Willkommen zum Smart Energy Monitor!",
      content: "Optimieren Sie Ihren Stromverbrauch durch intelligente Datenanalyse und KI-Empfehlungen.",
      highlight: null,
      position: "bottom"
    },
    {
      title: "Live Netz-Status",
      content: "Sehen Sie in Echtzeit: Aktueller Strompreis, CO₂-Intensität und Erneuerbare-Quote. Update alle 15 Sekunden.",
      highlight: "grid-status",
      position: "bottom"
    },
    {
      title: "Energiemix Analyse",
      content: "Visualisierung der deutschen Stromerzeugung nach Quelle. Solar, Wind, Kohle, Gas - alles auf einen Blick.",
      highlight: "energy-mix",
      position: "bottom"
    },
    {
      title: "24h Preisprognose",
      content: "Planen Sie Ihren Verbrauch! Die günstigste Zeit für energieintensive Geräte wird automatisch markiert.",
      highlight: "price-timeline",
      position: "bottom"
    },
    {
      title: "Smart Assistant ",
      content: "Stellen Sie Fragen! Der AI-Assistent gibt Ihnen personalisierte Empfehlungen basierend auf echten Daten.",
      highlight: "smart-assistant",
      position: "bottom"
    },
    {
      title: "3D Smart Home",
      content: "Interaktives 3D-Modell: Klicken Sie auf Räume für Details. Die Farbe zeigt den aktuellen Netz-Status.",
      highlight: "house-3d",
      position: "bottom"
    },
    {
      title: "Fertig!",
      content: "Sie sind bereit! Sparen Sie Geld und schonen Sie die Umwelt durch optimiertes Energie-Timing.",
      highlight: null,
      position: "bottom"
    }
  ];

  useEffect(() => {
    // Check if user has completed tour before
    const tourCompleted = localStorage.getItem('onboarding_completed');
    if (!tourCompleted) {
      // Show tour for first-time users after 3 seconds (warten bis Daten geladen sind)
      setTimeout(() => setIsActive(true), 3000);
    }
  }, []);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    if (neverShowAgain) {
      localStorage.setItem('onboarding_completed', 'true');
    }
    setIsActive(false);
    setCurrentStep(0);
  };

  const completeTour = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsActive(false);
    setCurrentStep(0);
  };

  const restartTour = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const currentStepData = steps[currentStep];

  if (!isActive) {
    // Floating Help Button (bottom right)
    return (
      <button
        onClick={restartTour}
        className="fixed bottom-6 right-6 z-50 bg-gray-600 hover:bg-gray-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 group"
        title="Tour starten"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="absolute -top-12 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          energy.maazi.de Tour
        </span>
      </button>
    );
  }

  // Tour Overlay
  return (
    <>
      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-70 z-40 transition-opacity duration-300" />

      {/* Tour Card */}
      <div className={`fixed z-50 transition-all duration-500 ${
        currentStepData.position === 'center' 
          ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' 
          : currentStepData.position === 'top'
          ? 'top-24 left-1/2 -translate-x-1/2'
          : currentStepData.position === 'bottom'
          ? 'bottom-24 left-1/2 -translate-x-1/2'
          : currentStepData.position === 'left'
          ? 'top-1/2 left-24 -translate-y-1/2'
          : currentStepData.position === 'right'
          ? 'top-1/2 right-24 -translate-y-1/2'
          : currentStepData.position === 'bottom-right'
          ? 'bottom-24 right-24'
          : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
      }`}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-lg">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-blue-600' 
                    : index < currentStep 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {currentStepData.title}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {currentStepData.content}
            </p>
          </div>

          {/* Step Counter */}
          <div className="text-sm text-gray-500 mb-4">
            Schritt {currentStep + 1} von {steps.length}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              ← Zurück
            </button>

            <div className="flex gap-3">
              <button
                onClick={skipTour}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition"
              >
                Überspringen
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                {currentStep === steps.length - 1 ? 'Fertig!' : 'Weiter →'}
              </button>
            </div>
          </div>

          {/* Never Show Again */}
          {currentStep === 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={neverShowAgain}
                  onChange={(e) => setNeverShowAgain(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-600">
                  Diese Tour nicht mehr automatisch zeigen
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Highlight Effect (optional - requires IDs on components) */}
      {currentStepData.highlight && (
        <style>{`
          #${currentStepData.highlight} {
            position: relative;
            z-index: 45;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
            border-radius: 12px;
          }
        `}</style>
      )}
    </>
  );
};

export default OnboardingTour;
