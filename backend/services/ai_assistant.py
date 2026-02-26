"""
Smart Energy AI Assistant
Hybrid approach: Rule-Based (fast) + Ollama (complex queries)
"""

import requests
import os
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class SmartEnergyAssistant:
    """
    AI Assistant for energy-related questions
    
    Strategy:
    - 90-95% questions → Rule-based (instant)
    - 5-10% questions → Ollama (2-5 seconds)
    """
    
    def __init__(self):
        self.ollama_url = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
        self.model = os.getenv("OLLAMA_MODEL", "falcon3:3b")
        
        # Rule-based patterns
        self.rules = {
            "preis": self._get_price_info,
            "price": self._get_price_info,
            "günstig": self._get_cheapest_time,
            "cheap": self._get_cheapest_time,
            "teuer": self._get_expensive_time,
            "expensive": self._get_expensive_time,
            "grün": self._get_greenest_time,
            "green": self._get_greenest_time,
            "sauber": self._get_greenest_time,
            "co2": self._get_co2_info,
            "laden": self._get_charging_advice,
            "charge": self._get_charging_advice,
            "waschen": self._get_washing_advice,
            "wash": self._get_washing_advice,
            "spülen": self._get_dishwasher_advice,
            "dishwasher": self._get_dishwasher_advice,
        }
    
    def ask(self, user_query: str, grid_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point for user questions
        
        Args:
            user_query: User's question
            grid_data: Current grid data context
        
        Returns:
            {
                "answer": "...",
                "type": "instant" | "ai" | "fallback",
                "confidence": "high" | "medium" | "low"
            }
        """
        query_lower = user_query.lower()
        
        # 1. Try rule-based first (INSTANT)
        for keyword, handler in self.rules.items():
            if keyword in query_lower:
                try:
                    answer = handler(grid_data)
                    return {
                        "answer": answer,
                        "type": "instant",
                        "confidence": "high",
                        "processing_time_ms": 0
                    }
                except Exception as e:
                    logger.error(f"Rule-based handler error: {e}")
        
        # 2. Fall back to Ollama for complex questions
        return self._ask_ollama(user_query, grid_data)
    
    def _ask_ollama(self, query: str, grid_data: Dict) -> Dict:
        """Call Ollama for complex queries"""
        
        import time
        start_time = time.time()
        
        # Build context-rich prompt
        prompt = self._build_prompt(query, grid_data)
        
        try:
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 150,  # Limit response length
                        "top_p": 0.9,
                    }
                },
                timeout=10  # Prevent hanging
            )
            
            processing_time = int((time.time() - start_time) * 1000)
            
            if response.status_code == 200:
                answer = response.json().get("response", "").strip()
                return {
                    "answer": answer,
                    "type": "ai",
                    "confidence": "medium",
                    "processing_time_ms": processing_time
                }
            else:
                logger.error(f"Ollama error: {response.status_code}")
                return self._fallback_answer(query)
        
        except Exception as e:
            logger.error(f"Ollama request failed: {e}")
            return self._fallback_answer(query)
    
    def _build_prompt(self, query: str, grid_data: Dict) -> str:
        """Create a focused prompt for Ollama"""
        
        current = grid_data.get("current", {})
        forecast = grid_data.get("forecast", [])
        
        # Find cheapest and greenest times
        cheapest = min(forecast, key=lambda x: x.get("price", 999)) if forecast else {}
        greenest = min(forecast, key=lambda x: x.get("co2", 999)) if forecast else {}
        
        prompt = f"""Du bist ein Energie-Assistent für ein Smart Home System.

Aktuelle Stromdaten:
- Preis: {current.get('price', 'N/A')} €/kWh
- CO2-Intensität: {current.get('co2', 'N/A')} g/kWh
- Energiemix: Solar {current.get('mix', {}).get('solar', 0)}%, Wind {current.get('mix', {}).get('wind', 0)}%, Kohle {current.get('mix', {}).get('coal', 0)}%

Günstigste Zeit heute: {cheapest.get('hour', 'N/A')} ({cheapest.get('price', 'N/A')} €/kWh)
Grünste Zeit heute: {greenest.get('hour', 'N/A')} ({greenest.get('co2', 'N/A')} g/kWh)

Nutzerfrage: {query}

Antworte kurz, freundlich und konkret (max. 3 Sätze). Nutze die Daten oben."""

        return prompt
    
    # ========== RULE-BASED HANDLERS (INSTANT) ==========
    
    def _get_price_info(self, data: Dict) -> str:
        current = data.get("current", {})
        price = current.get("price")
        avg = data.get("average_price", 0.30)
        
        if not price:
            return "Aktuelle Preisdaten sind nicht verfügbar."
        
        if price < avg * 0.8:
            status = "sehr günstig"
            emoji = "💰"
        elif price < avg:
            status = "günstig"
            emoji = "👍"
        else:
            status = "teuer"
            emoji = "⚠️"
        
        return f"{emoji} Aktueller Strompreis: {price:.4f} €/kWh ({status})"
    
    def _get_cheapest_time(self, data: Dict) -> str:
        forecast = data.get("forecast", [])
        if not forecast:
            return "Keine Vorhersagedaten verfügbar."
        
        cheapest = min(forecast, key=lambda x: x.get("price", 999))
        return f"⚡ Am günstigsten ist Strom heute um {cheapest.get('hour', 'N/A')}: {cheapest.get('price', 0):.4f} €/kWh"
    
    def _get_expensive_time(self, data: Dict) -> str:
        forecast = data.get("forecast", [])
        if not forecast:
            return "Keine Vorhersagedaten verfügbar."
        
        expensive = max(forecast, key=lambda x: x.get("price", 0))
        return f"🔴 Am teuersten ist Strom heute um {expensive.get('hour', 'N/A')}: {expensive.get('price', 0):.4f} €/kWh"
    
    def _get_greenest_time(self, data: Dict) -> str:
        forecast = data.get("forecast", [])
        if not forecast:
            return "Keine Vorhersagedaten verfügbar."
        
        greenest = min(forecast, key=lambda x: x.get("co2", 999))
        return f"🌱 Am grünsten ist Strom heute um {greenest.get('hour', 'N/A')}: {greenest.get('co2', 0):.1f} g CO2/kWh"
    
    def _get_co2_info(self, data: Dict) -> str:
        current = data.get("current", {})
        co2 = current.get("co2")
        
        if not co2:
            return "CO2-Daten sind nicht verfügbar."
        
        if co2 < 200:
            status = "sehr sauber"
            emoji = "🌱"
        elif co2 < 400:
            status = "mittel"
            emoji = "😐"
        else:
            status = "schmutzig"
            emoji = "🏭"
        
        return f"{emoji} Aktuelle CO2-Intensität: {co2:.1f} g/kWh ({status})"
    
    def _get_charging_advice(self, data: Dict) -> str:
        current = data.get("current", {})
        price = current.get("price", 0)
        avg = data.get("average_price", 0.30)
        
        forecast = data.get("forecast", [])
        cheapest = min(forecast, key=lambda x: x.get("price", 999)) if forecast else {}
        
        if price < avg * 0.85:
            return f"✅ Jetzt laden! Aktueller Preis ({price:.4f} €/kWh) ist günstig."
        else:
            return f"⏳ Besser warten bis {cheapest.get('hour', 'N/A')} ({cheapest.get('price', 0):.4f} €/kWh). Aktuell zu teuer."
    
    def _get_washing_advice(self, data: Dict) -> str:
        # Waschmaschine: ~2 kWh pro Zyklus
        return self._get_device_advice(data, device="Waschmaschine", power_kwh=2.0)
    
    def _get_dishwasher_advice(self, data: Dict) -> str:
        # Geschirrspüler: ~1.5 kWh pro Zyklus
        return self._get_device_advice(data, device="Geschirrspüler", power_kwh=1.5)
    
    def _get_device_advice(self, data: Dict, device: str, power_kwh: float) -> str:
        current = data.get("current", {})
        price = current.get("price", 0)
        
        forecast = data.get("forecast", [])
        cheapest = min(forecast, key=lambda x: x.get("price", 999)) if forecast else {}
        
        cost_now = price * power_kwh
        cost_cheapest = cheapest.get("price", 0) * power_kwh
        savings = cost_now - cost_cheapest
        
        if savings > 0.05:  # 5 Cent Ersparnis lohnt sich
            return f"⏳ {device} besser um {cheapest.get('hour', 'N/A')} laufen lassen. Spart {savings:.2f}€ (jetzt: {cost_now:.2f}€ vs. dann: {cost_cheapest:.2f}€)"
        else:
            return f"✅ {device} kann jetzt laufen. Kosten: {cost_now:.2f}€ (kaum Unterschied zu günstigster Zeit)"
    
    def _fallback_answer(self, query: str) -> Dict:
        """Fallback when Ollama is unavailable"""
        return {
            "answer": "Entschuldigung, ich konnte deine Frage nicht verarbeiten. Versuche konkretere Fragen wie 'Wann ist Strom günstig?' oder 'Soll ich jetzt laden?'",
            "type": "fallback",
            "confidence": "low",
            "processing_time_ms": 0
        }


# Example usage
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    assistant = SmartEnergyAssistant()
    
    # Mock grid data
    mock_data = {
        "current": {
            "price": 0.28,
            "co2": 350,
            "mix": {"solar": 45, "wind": 30, "coal": 15, "gas": 10}
        },
        "average_price": 0.30,
        "forecast": [
            {"hour": "14:00", "price": 0.25, "co2": 300},
            {"hour": "15:00", "price": 0.22, "co2": 280},
            {"hour": "16:00", "price": 0.30, "co2": 350},
        ]
    }
    
    questions = [
        "Wie ist der aktuelle Strompreis?",
        "Wann ist Strom am günstigsten?",
        "Soll ich mein E-Auto jetzt laden?",
        "Ist der Strom gerade grün?",
    ]
    
    for q in questions:
        result = assistant.ask(q, mock_data)
        print(f"\nQ: {q}")
        print(f"A: {result['answer']} [{result['type']}]")