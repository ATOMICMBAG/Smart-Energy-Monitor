/**
 * PriceTimeline Component
 * 24h Strompreis-Forecast mit Markierung der besten Zeit
 */

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getGridForecast } from "../api/client";

// Vordefinierte Städte
const CITIES = [
  "Berlin",
  "Hamburg",
  "München",
  "Köln",
  "Frankfurt",
  "Stuttgart",
  "Düsseldorf",
  "Dortmund",
  "Essen",
  "Bremen",
  "Dresden",
  "Hannover",
  "Leipzig",
  "Nürnberg",
  "Duisburg",
  "Bochum",
  "Wuppertal",
  "Bielefeld",
  "Bonn",
  "Mannheim",
  "Karlsruhe",
  "Wiesbaden",
  "Münster",
  "Gelsenkirchen",
  "Mönchengladbach",
  "Aachen",
  "Augsburg",
  "Braunschweig",
  "Krefeld",
  "Kiel",
  "Chemnitz",
  "Magdeburg",
  "Halle",
  "Freiburg im Breisgau",
  "Lübeck",
  "Oberhausen",
  "Kassel",
  "Mainz",
  "Rostock",
  "Erfurt",
  "Hagen",
  "Saarbrücken",
  "Hamm",
  "Mülheim an der Ruhr",
  "Potsdam",
  "Solingen",
  "Leverkusen",
  "Oldenburg",
  "Osnabrück",
  "Ludwigshafen am Rhein",
  "Herne",
  "Paderborn",
  "Heidelberg",
  "Neuss",
  "Darmstadt",
  "Ingolstadt",
  "Würzburg",
  "Regensburg",
  "Bottrop",
  "Recklinghausen",
  "Pforzheim",
  "Offenbach am Main",
  "Göttingen",
  "Wolfsburg",
  "Ulm",
  "Heilbronn",
  "Jena",
  "Trier",
  "Moers",
  "Erlangen",
  "Bergisch Gladbach",
  "Koblenz",
  "Remscheid",
  "Reutlingen",
  "Bremerhaven",
  "Fürth",
  "Cottbus",
  "Salzgitter",
  "Hildesheim",
  "Siegen",
];

const PriceTimeline = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("line"); // 'line' oder 'area'
  const [selectedCity, setSelectedCity] = useState("München"); // Default Stadt

  const fetchData = async () => {
    try {
      const response = await getGridForecast(24, selectedCity);
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching price forecast:", err);
      setError("Fehler beim Laden der Prognose");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Update alle 60s
    return () => clearInterval(interval);
  }, [selectedCity]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          24h Preisprognose
        </h2>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          24h Preisprognose
        </h2>
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  if (!data?.forecast || data.forecast.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          24h Preisprognose
        </h2>
        <div className="text-gray-500 text-center">
          Keine Prognosedaten verfügbar
        </div>
      </div>
    );
  }

  // Daten für Chart aufbereiten
  const chartData = data.forecast.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    price: item.price,
    timestamp: item.timestamp,
  }));

  // Finde günstigste Zeit
  const cheapestTime = data.forecast.reduce(
    (min, current) => (current.price < min.price ? current : min),
    data.forecast[0],
  );

  const cheapestTimeFormatted = new Date(
    cheapestTime.timestamp,
  ).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Berechne Durchschnittspreis
  const avgPrice =
    data.forecast.reduce((sum, item) => sum + item.price, 0) /
    data.forecast.length;

  // Finde teuerste Zeit
  const expensiveTime = data.forecast.reduce(
    (max, current) => (current.price > max.price ? current : max),
    data.forecast[0],
  );

  const priceRange = expensiveTime.price - cheapestTime.price;
  const savingPotential = ((priceRange / avgPrice) * 100).toFixed(0);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-700">{data.time} Uhr</p>
          <p className="text-gray-900 font-bold">
            {data.price ? data.price.toFixed(2) : "---"} €/kWh
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header mit Stadt- und View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            24h Preisprognose
          </h2>
          {/* Stadt-Auswahl */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-1 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 flex justify-end gap-2">
          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("line")}
              className={`px-3 py-1 rounded text-sm font-medium transition ${
                viewMode === "line"
                  ? "bg-gray-700 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Linie
            </button>
            <button
              onClick={() => setViewMode("area")}
              className={`px-3 py-1 rounded text-sm font-medium transition ${
                viewMode === "area"
                  ? "bg-gray-700 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Fläche
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">für {selectedCity}</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Günstigste Zeit</div>
          <div className="text-lg font-bold text-black-600">
            {cheapestTimeFormatted}
          </div>
          <div className="text-sm text-gray-700">
            {cheapestTime.price ? cheapestTime.price.toFixed(2) : "---"} €/kWh
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Durchschnitt</div>
          <div className="text-lg font-bold text-black-600">
            {avgPrice ? avgPrice.toFixed(2) : "---"} €/kWh
          </div>
          <div className="text-sm text-gray-700">Ø über 24h</div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Sparpotential</div>
          <div className="text-lg font-bold text-black-600">
            {savingPotential || "---"}%
          </div>
          <div className="text-sm text-gray-700">Durch Timing</div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        {viewMode === "line" ? (
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              stroke="#6b7280"
              tick={{ fontSize: 12, angle: -45, textAnchor: "end" }} // Tick-Winkel anpassen
              interval={Math.floor(chartData.length / 24)} // Alle 24 Stunden anzeigen
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              domain={["auto", "auto"]}
              tickFormatter={(value) => `${value.toFixed(2)}€`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={avgPrice}
              stroke="#3b82f6"
              strokeDasharray="5 5"
              label={{ value: "Ø", position: "right", fill: "#3b82f6" }}
            />
            <ReferenceLine
              y={cheapestTime.price}
              stroke="#10b981"
              strokeDasharray="3 3"
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        ) : (
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              interval={Math.floor(chartData.length / 8)}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              domain={["auto", "auto"]}
              tickFormatter={(value) => `${value.toFixed(2)}€`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={avgPrice}
              stroke="#3b82f6"
              strokeDasharray="5 5"
              label={{ value: "Ø", position: "right", fill: "#3b82f6" }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>

      {/* Empfehlung */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm text-gray-700">
              Starten Sie energieintensive Geräte (Waschmaschine, E-Auto,
              Geschirrspüler) idealerweise um{" "}
              <span className="font-bold text-gray-900">
                {cheapestTimeFormatted} Uhr
              </span>
              . So sparen Sie bis zu{" "}
              <span className="font-bold text-gray-900">
                {savingPotential}%
              </span>{" "}
              im Vergleich zur teuersten Zeit!
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Prognosedaten basieren auf SMARD.de • Aktualisierung alle 60 Sekunden
      </div>
    </div>
  );
};

export default PriceTimeline;
