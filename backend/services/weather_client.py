"""
OpenWeatherMap API Client
Fetches weather data for solar production estimates
"""

import requests
import os
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class WeatherClient:
    """Client for OpenWeatherMap API"""
    
    BASE_URL = "https://api.openweathermap.org/data/2.5"
    
    # Munich coordinates (jambit location)
    DEFAULT_LAT = 48.1351
    DEFAULT_LON = 11.5820
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENWEATHER_API_KEY")
        if not self.api_key:
            logger.warning("OpenWeather API key not set!")
        
        self.session = requests.Session()
    
    def get_current_weather(self, lat: float = None, lon: float = None) -> Dict:
        """
        Get current weather data
        
        Returns:
            {
                "temp": 15.5,  # Celsius
                "clouds": 20,  # Percentage
                "description": "clear sky",
                "solar_estimate": 0.85  # 0-1, estimated solar production capacity
            }
        """
        lat = lat or self.DEFAULT_LAT
        lon = lon or self.DEFAULT_LON
        
        if not self.api_key:
            return self._mock_weather()
        
        try:
            url = f"{self.BASE_URL}/weather"
            params = {
                "lat": lat,
                "lon": lon,
                "appid": self.api_key,
                "units": "metric"
            }
            
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Calculate solar estimate based on cloud cover
            clouds = data.get("clouds", {}).get("all", 0)
            solar_estimate = self._calculate_solar_estimate(clouds)
            
            return {
                "temp": data.get("main", {}).get("temp"),
                "clouds": clouds,
                "description": data.get("weather", [{}])[0].get("description", ""),
                "solar_estimate": solar_estimate,
                "humidity": data.get("main", {}).get("humidity"),
                "wind_speed": data.get("wind", {}).get("speed"),
            }
        
        except requests.RequestException as e:
            logger.error(f"OpenWeather API error: {e}")
            return self._mock_weather()
    
    def get_forecast(self, lat: float = None, lon: float = None, hours: int = 24) -> list:
        """
        Get weather forecast for next X hours
        
        Returns:
            [
                {
                    "timestamp": ...,
                    "hour": "14:00",
                    "temp": 18.5,
                    "solar_estimate": 0.75
                },
                ...
            ]
        """
        lat = lat or self.DEFAULT_LAT
        lon = lon or self.DEFAULT_LON
        
        if not self.api_key:
            return []
        
        try:
            url = f"{self.BASE_URL}/forecast"
            params = {
                "lat": lat,
                "lon": lon,
                "appid": self.api_key,
                "units": "metric"
            }
            
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            forecast = []
            for item in data.get("list", [])[:hours//3]:  # 3h intervals
                clouds = item.get("clouds", {}).get("all", 0)
                
                forecast.append({
                    "timestamp": item.get("dt", 0) * 1000,  # ms
                    "hour": item.get("dt_txt", "").split()[1][:5],
                    "temp": item.get("main", {}).get("temp"),
                    "clouds": clouds,
                    "solar_estimate": self._calculate_solar_estimate(clouds),
                })
            
            return forecast
        
        except requests.RequestException as e:
            logger.error(f"OpenWeather forecast error: {e}")
            return []
    
    def _calculate_solar_estimate(self, cloud_coverage: int) -> float:
        """
        Estimate solar production capacity based on cloud coverage
        
        Args:
            cloud_coverage: Percentage 0-100
        
        Returns:
            Solar capacity estimate 0.0-1.0
        """
        # Simple model: less clouds = more solar
        # 0% clouds = 100% capacity
        # 100% clouds = ~10% capacity (diffuse light)
        
        base_capacity = 1.0 - (cloud_coverage / 100 * 0.9)
        return round(base_capacity, 2)
    
    def _mock_weather(self) -> Dict:
        """Fallback mock data when API is unavailable"""
        return {
            "temp": 15.0,
            "clouds": 20,
            "description": "partly cloudy",
            "solar_estimate": 0.8,
            "humidity": 60,
            "wind_speed": 3.5,
        }


# Example usage
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    client = WeatherClient()
    
    print("Current Weather:", client.get_current_weather())
    print("\nForecast (next 12h):")
    
    forecast = client.get_forecast(hours=12)
    for item in forecast[:4]:
        print(f"  {item['hour']}: {item['temp']}°C, Solar: {item['solar_estimate']*100}%")