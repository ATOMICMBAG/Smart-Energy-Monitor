"""
SMARD.de API Client
Fetches real-time electricity data from Germany's grid
Updated to use correct API format from https://smard.api.bund.dev/
"""

import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class SMARDClient:
    """Client for SMARD.de (Bundesnetzagentur) API"""
    
    BASE_URL = "https://www.smard.de/app"
    
    # Filter IDs from SMARD API documentation
    FILTERS = {
        "price": 4169,  # Marktpreis: Deutschland/Luxemburg
        "solar": 4068,  # Stromerzeugung: Photovoltaik
        "wind_onshore": 4067,  # Stromerzeugung: Wind Onshore
        "wind_offshore": 1225,  # Stromerzeugung: Wind Offshore
        "coal": 4069,  # Stromerzeugung: Steinkohle
        "gas": 4071,  # Stromerzeugung: Erdgas
        "biomass": 4066,  # Stromerzeugung: Biomasse
        "hydro": 1226,  # Stromerzeugung: Wasserkraft
    }
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "SmartEnergyMonitor/1.0"
        })
    
    def get_current_price(self) -> Optional[float]:
        """Get current electricity price in EUR/MWh, convert to EUR/kWh"""
        try:
            data = self._fetch_timeseries("price", hours=2)
            if data and len(data) > 0:
                # Get latest datapoint [timestamp_ms, value]
                latest = data[-1]
                price_eur_mwh = latest[1]
                if price_eur_mwh is not None:
                    # Convert to EUR/kWh
                    price_eur_kwh = price_eur_mwh / 1000
                    return round(price_eur_kwh, 4)
            return None
        except Exception as e:
            logger.error(f"Error fetching current price: {e}")
            return None
    
    def get_price_forecast(self, hours: int = 24) -> List[Dict]:
        """
        Get price forecast for next X hours
        Returns: [{"timestamp": ..., "price": ..., "hour": ...}, ...]
        """
        try:
            data = self._fetch_timeseries("price", hours=hours)
            
            forecast = []
            for timestamp_ms, price_eur_mwh in data:
                if price_eur_mwh is not None:
                    dt = datetime.fromtimestamp(timestamp_ms / 1000)
                    forecast.append({
                        "timestamp": timestamp_ms,
                        "datetime": dt.isoformat(),
                        "hour": dt.strftime("%H:%M"),
                        "price": round(price_eur_mwh / 1000, 4),  # EUR/kWh
                    })
            
            return forecast
        except Exception as e:
            logger.error(f"Error fetching price forecast: {e}")
            return []
    
    def get_energy_mix(self) -> Dict[str, float]:
        """
        Get current energy mix (percentages)
        Returns: {"solar": 45.2, "wind": 30.1, ...}
        """
        try:
            mix_data = {}
            total_production = 0
            
            # Fetch production data for each source
            for source in ["solar", "wind_onshore", "wind_offshore", "coal", "gas", "biomass"]:
                data = self._fetch_timeseries(source, hours=1)
                if data and len(data) > 0:
                    production = data[-1][1] or 0
                    mix_data[source] = production
                    total_production += production
            
            # Convert to percentages
            if total_production > 0:
                energy_mix = {
                    source: round((value / total_production) * 100, 1)
                    for source, value in mix_data.items()
                }
            else:
                energy_mix = {}
            
            # Group wind sources
            if "wind_onshore" in energy_mix and "wind_offshore" in energy_mix:
                energy_mix["wind"] = energy_mix["wind_onshore"] + energy_mix["wind_offshore"]
                del energy_mix["wind_onshore"]
                del energy_mix["wind_offshore"]
            
            return energy_mix
        
        except Exception as e:
            logger.error(f"Error fetching energy mix: {e}")
            return {}
    
    def get_co2_intensity(self) -> Optional[float]:
        """
        Calculate approximate CO2 intensity (g/kWh)
        Based on energy mix and typical emission factors
        """
        try:
            mix = self.get_energy_mix()
            if not mix:
                return None
            
            # Emission factors (g CO2/kWh)
            emission_factors = {
                "solar": 0,
                "wind": 0,
                "coal": 820,  # Average coal
                "gas": 490,
                "biomass": 230,
                "hydro": 0,
            }
            
            total_emissions = 0
            for source, percentage in mix.items():
                factor = emission_factors.get(source, 0)
                total_emissions += (percentage / 100) * factor
            
            return round(total_emissions, 1)
        
        except Exception as e:
            logger.error(f"Error calculating CO2 intensity: {e}")
            return None
    
    def _fetch_timeseries(self, filter_name: str, hours: int = 24) -> List:
        """
        Internal method to fetch timeseries data from SMARD using 2-step process:
        1. Get available timestamps from index
        2. Fetch actual data using latest timestamp
        
        Args:
            filter_name: Key from FILTERS dict
            hours: How many hours of data to fetch
        
        Returns:
            List of [timestamp_ms, value] pairs
        """
        filter_id = self.FILTERS.get(filter_name)
        if not filter_id:
            raise ValueError(f"Unknown filter: {filter_name}")
        
        region = "DE"  # Germany
        resolution = "hour"  # hourly data
        
        try:
            # Step 1: Get available timestamps
            index_url = f"{self.BASE_URL}/chart_data/{filter_id}/{region}/index_{resolution}.json"
            
            response = self.session.get(index_url, timeout=10)
            response.raise_for_status()
            index_data = response.json()
            
            if "timestamps" not in index_data or len(index_data["timestamps"]) == 0:
                logger.warning(f"No timestamps available for {filter_name}")
                return []
            
            # Get the most recent timestamp
            latest_timestamp = index_data["timestamps"][-1]
            
            # Step 2: Fetch actual data using the timestamp
            # Note: API requires filter and region to be duplicated (bad API design)
            data_url = (
                f"{self.BASE_URL}/chart_data/{filter_id}/{region}/"
                f"{filter_id}_{region}_{resolution}_{latest_timestamp}.json"
            )
            
            response = self.session.get(data_url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if "series" in data and isinstance(data["series"], list):
                # Filter to requested time range
                now_ms = int(datetime.now().timestamp() * 1000)
                cutoff_ms = now_ms - (hours * 3600 * 1000)
                
                filtered_series = [
                    [ts, val] for ts, val in data["series"]
                    if ts >= cutoff_ms and ts <= now_ms
                ]
                
                return filtered_series
            else:
                logger.warning(f"Unexpected SMARD response format for {filter_name}")
                return []
        
        except requests.RequestException as e:
            logger.error(f"SMARD API error for {filter_name}: {e}")
            return []
        except Exception as e:
            logger.error(f"Error processing SMARD data for {filter_name}: {e}")
            return []


# Example usage
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    client = SMARDClient()
    
    print("Current Price:", client.get_current_price(), "EUR/kWh")
    print("\nEnergy Mix:", client.get_energy_mix())
    print("\nCO2 Intensity:", client.get_co2_intensity(), "g/kWh")
    
    forecast = client.get_price_forecast(hours=6)
    print(f"\nNext 6 hours forecast:")
    for item in forecast[:6]:
        print(f"  {item['hour']}: {item['price']} EUR/kWh")
