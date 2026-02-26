/**
 * EnergyMixChart Component
 * Visualisiert den Energiemix als Pie Chart
 */

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { getGridCurrent } from "../api/client";

const EnergyMixChart = () => {
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
      console.error("Error fetching energy mix:", err);
      setError("Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Update alle 30s
    return () => clearInterval(interval);
  }, []);

  // Farben für verschiedene Energiequellen
  const COLORS = {
    solar: "#9c822b", // Gelb
    wind: "#29559c", // Blau
    coal: "#374151", // Dunkelgrau
    gas: "#965426", // Orange
    nuclear: "#724f92", // Lila
    hydro: "#5aaab8", // Cyan
    biomass: "#3b6d5c", // Grün
    other: "#9CA3AF", // Grau
  };

  const LABELS = {
    solar: "Solar",
    wind: "Wind",
    coal: "Kohle",
    gas: "Gas",
    nuclear: "Atomkraft",
    hydro: "Wasser",
    biomass: "Biomasse",
    other: "Andere",
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Energiemix</h2>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Energiemix</h2>
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  if (!data?.energy_mix) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Energiemix</h2>
        <div className="text-gray-500 text-center">Keine Daten verfügbar</div>
      </div>
    );
  }

  // Daten für Recharts aufbereiten
  const chartData = Object.entries(data.energy_mix)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: LABELS[key] || key,
      value: Math.round(value * 10) / 10, // Runde auf 1 Dezimalstelle
      color: COLORS[key] || COLORS.other,
    }))
    .sort((a, b) => b.value - a.value);

  // Berechne Erneuerbare vs. Fossil
  const renewable =
    (data.energy_mix.solar || 0) +
    (data.energy_mix.wind || 0) +
    (data.energy_mix.hydro || 0) +
    (data.energy_mix.biomass || 0);
  const fossil = (data.energy_mix.coal || 0) + (data.energy_mix.gas || 0);

  // Custom Label für Pie Chart
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    if (percent < 0.0) return null; // Verstecke Labels <0% (percent < 0.0) oder <1% (percent < 0.1)

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="font-bold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Energiemix Deutschland
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
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
          <div className="text-sm text-gray-600 mb-1">Erneuerbare</div>
          <div className="text-3xl font-bold text-green-600">
            {Math.round(renewable)}%
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
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
          <div className="text-sm text-gray-600 mb-1">Fossil</div>
          <div className="text-3xl font-bold text-orange-600">
            {Math.round(fossil)}%
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `${value}%`}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "8px",
            }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>

      {/* Details Liste */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-gray-700">{item.name}</span>
              </div>
              <span className="font-semibold text-gray-800">{item.value}%</span>
            </div>
          ))}
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

export default EnergyMixChart;
