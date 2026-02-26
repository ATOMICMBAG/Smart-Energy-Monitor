/**
 * API Client for Smart Energy Monitor
 *
 * const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
 *
 */

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds (SMARD API ist langsam)
  headers: {
    "Content-Type": "application/json",
  },
});

// Grid Data
export const getGridCurrent = () => api.get("/api/grid/current");
export const getGridForecast = (hours = 24, location = "München") =>
  api.get(
    `/api/grid/forecast?hours=${hours}&location=${encodeURIComponent(location)}`,
  );
export const getGridStats = () => api.get("/api/grid/stats");

// Weather
export const getWeatherCurrent = () => api.get("/api/weather/current");
export const getWeatherForecast = (hours = 24) =>
  api.get(`/api/weather/forecast?hours=${hours}`);

// Devices
export const getDevices = () => api.get("/api/devices");
export const getDeviceRecommendation = (deviceId) =>
  api.get(`/api/devices/${deviceId}/recommendation`);

// AI Assistant
export const askAssistant = (query) =>
  api.post("/api/assistant/ask", { query });

export default api;
