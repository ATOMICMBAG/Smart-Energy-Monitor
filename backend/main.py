"""
FastAPI Main Application
Smart World & Home Energy Monitor
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import logging
import os

from models.database import (
    init_db, get_db, seed_devices,
    GridData, WeatherData, UserDevice
)
from services.smard_client import SMARDClient
from services.weather_client import WeatherClient
from services.ai_assistant import SmartEnergyAssistant

# Setup logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Smart Energy Monitor API",
    description="Real-time energy monitoring with AI assistance",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev
        "http://localhost:3010",  # Alternative
        os.getenv("FRONTEND_URL", "https://energy.maazi.de")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
smard_client = SMARDClient()
weather_client = WeatherClient()
ai_assistant = SmartEnergyAssistant()

# Pydantic models for requests/responses
class AskRequest(BaseModel):
    query: str

class AskResponse(BaseModel):
    answer: str
    type: str  # "instant" | "ai" | "fallback"
    confidence: str  # "high" | "medium" | "low"
    processing_time_ms: int = 0


# ========== STARTUP / SHUTDOWN ==========

@app.on_event("startup")
async def startup_event():
    """Initialize database and seed data"""
    logger.info("🚀 Starting Smart Energy Monitor API...")
    init_db()
    seed_devices()
    logger.info("✅ API ready!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("👋 Shutting down API...")


# ========== HEALTH CHECK ==========

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


# ========== GRID DATA ENDPOINTS ==========

@app.get("/api/grid/current")
async def get_current_grid_data(db: Session = Depends(get_db)):
    """
    Get current grid data (price, CO2, energy mix)
    """
    try:
        # Fetch real-time data from SMARD
        price = smard_client.get_current_price()
        energy_mix = smard_client.get_energy_mix()
        co2 = smard_client.get_co2_intensity()
        
        # Fallback wenn SMARD keine Daten liefert (nachts passiert das oft)
        if not price:
            price = 0.28  # Durchschnittspreis Deutschland 2026
        if not energy_mix or sum(energy_mix.values()) == 0:
            energy_mix = {
                "solar": 42.0,
                "wind": 28.0,
                "coal": 15.0,
                "gas": 10.0,
                "biomass": 5.0
            }
        if not co2:
            co2 = 320  # Typischer Wert für deutschen Mix
        
        # Store in database
        grid_entry = GridData(
            price_eur_kwh=price,
            co2_g_kwh=co2,
            energy_mix=energy_mix
        )
        db.add(grid_entry)
        db.commit()
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "price": price,
            "co2": co2,
            "energy_mix": energy_mix,
            "status": "günstig" if price < 0.30 else "normal"
        }
    
    except Exception as e:
        logger.error(f"Error fetching grid data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/grid/forecast")
async def get_price_forecast(hours: int = 24, location: str = "München"):
    """
    Get price forecast for next X hours
    Uses mock data since SMARD API doesn't provide forecasts
    """
    try:
        # Mock forecast data based on current price
        current_price = smard_client.get_current_price() or 0.30
        forecast = []

        # Create 24 hours of mock data with realistic variations
        for i in range(hours):
            # Simulate price variations around current price
            # More realistic: ±0.02 EUR/kWh variation with some larger jumps
            variation = (i % 12 - 6) * 0.01  # ±0.06 EUR/kWh variation
            if i % 4 == 0:  # Every 4 hours, add a larger jump
                variation += (i % 2 - 0.5) * 0.03
            price = round(current_price + variation, 4)

            # Create timestamp for each hour
            forecast_time = datetime.utcnow() + timedelta(hours=i)
            timestamp_ms = int(forecast_time.timestamp() * 1000)

            forecast.append({
                "timestamp": timestamp_ms,
                "datetime": forecast_time.isoformat(),
                "hour": forecast_time.strftime("%H:%M"),
                "price": price,
                "co2": smard_client.get_co2_intensity() or 350
            })

        return {
            "forecast": forecast,
            "hours": hours,
            "location": location
        }

    except Exception as e:
        logger.error(f"Error generating forecast: {e}")
        # Fallback to empty forecast if something goes wrong
        return {
            "forecast": [],
            "hours": hours
        }


@app.get("/api/grid/stats")
async def get_grid_stats():
    """
    Get aggregated statistics
    """
    try:
        forecast = smard_client.get_price_forecast(hours=24)
        
        if not forecast:
            return {"error": "No forecast data available"}
        
        prices = [f["price"] for f in forecast]
        
        return {
            "average_price": round(sum(prices) / len(prices), 4),
            "min_price": min(prices),
            "max_price": max(prices),
            "current_price": smard_client.get_current_price(),
        }
    
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== WEATHER ENDPOINTS ==========

@app.get("/api/weather/current")
async def get_current_weather(db: Session = Depends(get_db)):
    """
    Get current weather data for Munich
    """
    try:
        weather = weather_client.get_current_weather()
        
        # Store in database
        weather_entry = WeatherData(
            temperature_c=weather.get("temp"),
            cloud_coverage_percent=weather.get("clouds"),
            solar_estimate=weather.get("solar_estimate"),
            description=weather.get("description"),
            humidity_percent=weather.get("humidity"),
            wind_speed_ms=weather.get("wind_speed")
        )
        db.add(weather_entry)
        db.commit()
        
        return weather
    
    except Exception as e:
        logger.error(f"Error fetching weather: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/weather/forecast")
async def get_weather_forecast(hours: int = 24):
    """
    Get weather forecast for solar production estimate
    """
    try:
        forecast = weather_client.get_forecast(hours=hours)
        return {
            "forecast": forecast,
            "hours": hours
        }
    
    except Exception as e:
        logger.error(f"Error fetching weather forecast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== DEVICES ENDPOINTS ==========

@app.get("/api/devices")
async def get_devices(db: Session = Depends(get_db)):
    """
    Get all simulated smart home devices
    """
    devices = db.query(UserDevice).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "type": d.device_type,
            "power_kwh": d.power_kwh,
            "usage_per_week": d.usage_per_week,
            "flexible": bool(d.flexible),
            "room": d.room
        }
        for d in devices
    ]


@app.get("/api/devices/{device_id}/recommendation")
async def get_device_recommendation(device_id: int, db: Session = Depends(get_db)):
    """
    Get optimal usage recommendation for a device
    """
    device = db.query(UserDevice).filter(UserDevice.id == device_id).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Get price forecast
    forecast = smard_client.get_price_forecast(hours=24)
    current_price = smard_client.get_current_price() or 0.30
    
    # Find cheapest time
    cheapest = min(forecast, key=lambda x: x.get("price", 999)) if forecast else {}
    
    # Calculate costs
    cost_now = current_price * device.power_kwh
    cost_cheapest = cheapest.get("price", 0) * device.power_kwh
    savings = cost_now - cost_cheapest
    
    return {
        "device": device.name,
        "recommendation": "now" if savings < 0.05 else "wait",
        "best_time": cheapest.get("hour", "N/A"),
        "cost_now": round(cost_now, 2),
        "cost_best": round(cost_cheapest, 2),
        "potential_savings": round(savings, 2)
    }


# ========== AI ASSISTANT ENDPOINTS ==========

@app.post("/api/assistant/ask", response_model=AskResponse)
async def ask_assistant(request: AskRequest):
    """
    Ask the AI assistant a question about energy
    """
    try:
        # Gather context data
        current_price = smard_client.get_current_price()
        co2 = smard_client.get_co2_intensity()
        mix = smard_client.get_energy_mix()
        forecast = smard_client.get_price_forecast(hours=24)
        
        # Build grid data context
        grid_data = {
            "current": {
                "price": current_price,
                "co2": co2,
                "mix": mix
            },
            "average_price": 0.30,  # Could calculate from historical data
            "forecast": forecast
        }
        
        # Ask AI
        result = ai_assistant.ask(request.query, grid_data)
        
        return AskResponse(**result)
    
    except Exception as e:
        logger.error(f"Error in AI assistant: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== RUN SERVER ==========

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))  # Anderer Port verwenden

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("DEBUG", "False").lower() == "true"
    )
