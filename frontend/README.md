# Smart Energy Monitor - Frontend

React Frontend für das jambit Bewerbungsprojekt.

## 🚀 Quick Start

### 1. Dependencies installieren (bereits erledigt ✅)
```bash
npm install
```

### 2. Backend starten
```bash
# In einem separaten Terminal
cd ../backend
python -m uvicorn main:app --reload
```

### 3. Frontend starten
```bash
npm run dev
```

Frontend ist dann verfügbar unter: **http://localhost:5173**

## 📦 Component Übersicht

- **GridStatus.jsx** - Live Grid-Status mit Preis, CO2, Energiemix
- **EnergyMixChart.jsx** - Pie Chart des deutschen Energiemix
- **PriceTimeline.jsx** - 24h Preisvorhersage mit Smart-Tipps
- **SmartAssistant.jsx** - AI-Chat mit Instant & AI-powered Antworten
- **House3D.jsx** - Interaktives 3D Smart Home (Three.js)

## 🛠️ Tech Stack

- **React 18** - UI Framework
- **Vite** - Build Tool & Dev Server
- **TailwindCSS** - Styling
- **Three.js / React-Three-Fiber** - 3D Visualisierung
- **Recharts** - Charts & Graphs
- **Axios** - API Client

## 🔧 Environment Variables

Siehe `.env` - Backend API URL konfigurieren:
```
VITE_API_URL=http://localhost:8000
```

## 📝 Wichtige Commands

```bash
npm run dev      # Development Server
npm run build    # Production Build
npm run preview  # Preview Production Build
```

## 🎨 Features

✅ Live-Daten vom deutschen Stromnetz (SMARD.de)  
✅ Automatische Updates (15s - 60s)  
✅ AI-gestützter Assistent  
✅ Interaktive 3D-Visualisierung  
✅ Responsive Design  
✅ Error Handling & Loading States  

---

