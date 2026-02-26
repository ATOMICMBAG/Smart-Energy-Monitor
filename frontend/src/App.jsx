/**
 * Main App Component
 * Smart Energy Monitor Dashboard
 * Bewerbungsprojekt für jambit GmbH
 * Mit UX-Verbesserungen: Onboarding, Theme Switcher, View Modi
 */

import { useState } from "react";
import GridStatus from "./components/GridStatus";
import EnergyMixChart from "./components/EnergyMixChart";
import PriceTimeline from "./components/PriceTimeline";
import SmartAssistant from "./components/SmartAssistant";
import House3D from "./components/House3D";
import OnboardingTour from "./components/OnboardingTour";
import SettingsPanel from "./components/SettingsPanel";

function App() {
  const [viewMode, setViewMode] = useState("main");

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background-color)" }}
    >
      {/* Maazi-style Fixed Header */}
      <header className="maazi-header">
        <div className="px-4 py-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="https://energy.maazi.de/" className="maazi-logo">
                maazi.de
              </a>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <a href="https://energy.maazi.de/" className="maazi-logo">
                  Smart Energy Monitor
                </a>
                <p
                  className="text-lg font-bold"
                  style={{ color: "var(--accent-color)" }}
                >
                  {" "}
                </p>
              </div>
              <div
                className="w-px h-12"
                style={{ backgroundColor: "var(--border-color)" }}
              ></div>
              <div className="text-left">
                <p
                  className="text-xs"
                  style={{ color: "var(--secondary-color)" }}
                >
                  Tech Stack
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-color)" }}
                >
                  React • FastAPI • Ollama
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="maazi-section">
        {/* Top Section: Grid Status + Energy Mix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="maazi-card">
            <GridStatus />
          </div>
          <div className="maazi-card">
            <EnergyMixChart />
          </div>
        </div>

        {/* Bottom Section: 3D House + AI Assistant */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="maazi-card">
            <House3D />
          </div>
          <div className="maazi-card">
            <SmartAssistant />
          </div>
        </div>

        {/* Footer Info */}
        <footer className="maazi-footer">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            <div className="maazi-light-card">
              <h3 style={{ color: "var(--text-color)" }}>Datenquellen</h3>
              <ul
                className="text-sm space-y-1 mt-2"
                style={{ color: "var(--text-color)" }}
              >
                <li className="maazi-list-item pl-4 relative">
                  SMARD.de API (Bundesnetzagentur)
                </li>
                <li className="maazi-list-item pl-4 relative">
                  OpenWeatherMap API
                </li>
                <li className="maazi-list-item pl-4 relative">
                  Smart Energy Assistent (Ollama AI - falcon3:3b)
                </li>
              </ul>
            </div>
            <div className="maazi-light-card">
              <h3 style={{ color: "var(--text-color)" }}>Features</h3>
              <ul
                className="text-sm space-y-1 mt-2"
                style={{ color: "var(--text-color)" }}
              >
                <li className="maazi-list-item pl-4 relative">
                  Live Strompreis-Tracking
                </li>
                <li className="maazi-list-item pl-4 relative">
                  CO₂-Intensität Monitoring
                </li>
                <li className="maazi-list-item pl-4 relative">
                  24h Preis-Prognose
                </li>
                <li className="maazi-list-item pl-4 relative">
                  AI-gestützte Beratung
                </li>
                <li className="maazi-list-item pl-4 relative">
                  3D Smart Home Visualisierung
                </li>
              </ul>
            </div>
            <div className="maazi-light-card">
              <h3 style={{ color: "var(--text-color)" }}>
                Über dieses Projekt
              </h3>
              <p
                className="text-sm mt-2"
                style={{ color: "var(--text-color)" }}
              >
                Dieses Demo-Projekt zeigt die Integration von{" "}
                <strong>IoT</strong>,<strong>AI</strong> und{" "}
                <strong>3D-Visualisierung</strong> in einer produktionsreifen
                Web-Plattform. Entwickelt als Initiativbewerbung für jambit
                GmbH.
              </p>
            </div>
          </div>
          <div
            className="mt-6 text-center text-xs"
            style={{ color: "var(--text-color)" }}
          >
            <p>energy.maazi.de • 2026</p>
          </div>
        </footer>
      </main>

      {/* Settings Panel (ohne Theme, da Maazi-Design kein Dark Mode hat) */}
      <SettingsPanel onViewModeChange={setViewMode} />

      {/* Onboarding Tour */}
      <OnboardingTour />
    </div>
  );
}

export default App;
