"""
Database models for Energy Monitor
"""

from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

Base = declarative_base()


class GridData(Base):
    """Stores grid electricity data from SMARD"""
    __tablename__ = "grid_data"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Price data
    price_eur_kwh = Column(Float, nullable=True)  # EUR/kWh
    
    # CO2 data
    co2_g_kwh = Column(Float, nullable=True)  # g CO2/kWh
    
    # Energy mix (stored as JSON)
    energy_mix = Column(JSON, nullable=True)  # {"solar": 45, "wind": 30, ...}
    
    # Metadata
    source = Column(String, default="SMARD")


class WeatherData(Base):
    """Stores weather data for solar estimates"""
    __tablename__ = "weather_data"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Location
    latitude = Column(Float, default=48.1351)  # Munich
    longitude = Column(Float, default=11.5820)
    
    # Weather
    temperature_c = Column(Float, nullable=True)
    cloud_coverage_percent = Column(Integer, nullable=True)
    solar_estimate = Column(Float, nullable=True)  # 0.0-1.0
    
    # Additional
    description = Column(String, nullable=True)
    humidity_percent = Column(Integer, nullable=True)
    wind_speed_ms = Column(Float, nullable=True)
    
    # Metadata
    source = Column(String, default="OpenWeather")


class UserDevice(Base):
    """Simulated smart home devices for demo"""
    __tablename__ = "user_devices"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Device info
    name = Column(String, nullable=False)  # "Waschmaschine", "E-Auto", etc.
    device_type = Column(String, nullable=False)  # "appliance", "vehicle"
    power_kwh = Column(Float, nullable=False)  # Power consumption per cycle/charge
    
    # Usage pattern
    usage_per_week = Column(Integer, default=2)  # How often used
    flexible = Column(Integer, default=1)  # 1 = can schedule, 0 = immediate
    
    # Room (for 3D visualization)
    room = Column(String, nullable=True)  # "kitchen", "garage", etc.


# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///energy_monitor.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized")


def get_db():
    """Dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_devices():
    """Add sample devices for demo"""
    db = SessionLocal()
    
    # Check if devices already exist
    if db.query(UserDevice).count() > 0:
        print("Devices already seeded")
        db.close()
        return
    
    devices = [
        UserDevice(
            name="Waschmaschine",
            device_type="appliance",
            power_kwh=2.0,
            usage_per_week=3,
            flexible=1,
            room="bathroom"
        ),
        UserDevice(
            name="Geschirrspüler",
            device_type="appliance",
            power_kwh=1.5,
            usage_per_week=4,
            flexible=1,
            room="kitchen"
        ),
        UserDevice(
            name="E-Auto",
            device_type="vehicle",
            power_kwh=40.0,  # Full charge
            usage_per_week=7,
            flexible=1,
            room="garage"
        ),
        UserDevice(
            name="Wärmepumpe",
            device_type="appliance",
            power_kwh=8.0,  # Daily usage
            usage_per_week=7,
            flexible=0,  # Not flexible
            room="basement"
        ),
    ]
    
    db.add_all(devices)
    db.commit()
    db.close()
    
    print(f"✅ Seeded {len(devices)} devices")


if __name__ == "__main__":
    init_db()
    seed_devices()