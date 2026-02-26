/**
 * GridStatus Component
 * Zeigt aktuelle Stromnetz-Daten: Preis, CO2, Energiemix
 * Auto-Update alle 15 Sekunden
 */

import { useState, useEffect } from "react";
import { getGridCurrent } from "../api/client";

const GridStatus = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      const response = await getGridCurrent();
      setData(response.data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching grid data:", err);
      setError("Fehler beim Laden der Netzdaten");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Auto-update alle 15 Sekunden
    const interval = setInterval(fetchData, 15000);

    return () => clearInterval(interval);
  }, []);

  // Status-Logik: Grün (günstig), Gelb (normal), Rot (teuer)
  const getStatus = () => {
    if (!data) return { color: "gray", label: "Unbekannt" };

    const { price, co2 } = data;

    // Preisschwellen (€/kWh)
    const cheapThreshold = 0.25;
    const expensiveThreshold = 0.35;

    // CO2-Schwellen (g/kWh)
    const greenThreshold = 300;
    const dirtyThreshold = 500;

    // Preis-basiert
    if (price < cheapThreshold && co2 < greenThreshold) {
      return { color: "green", label: "Status Günstig & Grün" };
    }
    if (price < cheapThreshold) {
      return { color: "green", label: "Status Günstig" };
    }
    if (co2 < greenThreshold) {
      return { color: "green", label: "Status Grün" };
    }
    if (price > expensiveThreshold || co2 > dirtyThreshold) {
      return { color: "red", label: "Status Teuer/Schmutzig" };
    }

    return { color: "yellow", label: "Status Normal" };
  };

  const status = getStatus();

  // Farb-Klassen für Badge
  const statusColors = {
    green: "bg-green-200 text-white-800 border-2 border-gray-200",
    yellow: "bg-yellow-200 text-yellow-800 border-2 border-gray-200",
    red: "bg-red-200 text-white-800 border-2 border-gray-200",
    gray: "bg-gray-200 text-white-800 border-2 border-gray-200",
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-red-600 flex items-center gap-2">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header mit Status-Badge */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Netz</h2>
        <span
          className={`px-4 py-2 rounded-full font-semibold ${statusColors[status.color]}`}
        >
          {status.label}
        </span>
      </div>

      {/* Hauptdaten Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Strompreis */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border-2 border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
            <span className="text-sm text-gray-600 font-medium">
              Strompreis
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-700">
            {data.price ? data.price.toFixed(2) : "---"}{" "}
            <span className="text-lg">€/kWh</span>
          </div>
        </div>

        {/* Erneuerbare Quote */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border-2 border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="text-sm text-gray-600 font-medium">
              Erneuerbare
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-700">
            {data.energy_mix
              ? Math.round(
                  (data.energy_mix.solar || 0) +
                    (data.energy_mix.wind || 0) +
                    (data.energy_mix.hydro || 0) +
                    (data.energy_mix.biomass || 0),
                )
              : 0}
            <span className="text-lg">%</span>
          </div>
        </div>

        {/* CO2-Intensität */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border-2 border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
            <span className="text-sm text-gray-600 font-medium">
              CO₂-Intensität
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-700">
            {data.co2 ? Math.round(data.co2) : "---"}{" "}
            <span className="text-lg">g/kWh</span>
          </div>
        </div>
      </div>

      {/* Footer mit Zeitstempel */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
        <span>
          Letzte Aktualisierung: {lastUpdate?.toLocaleTimeString("de-DE")}
        </span>
        <span className="flex items-center gap-1">
          SMARD.de API
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </span>
      </div>
    </div>
  );
};

export default GridStatus;
