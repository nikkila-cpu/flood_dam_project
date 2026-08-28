from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    river: Mapped[str | None] = mapped_column(String(100), nullable=True)
    dam: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    kind: Mapped[str] = mapped_column(String(30))
    filename: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(String(500))
    size_bytes: Mapped[int] = mapped_column(Integer)
    crs: Mapped[str | None] = mapped_column(String(100), nullable=True)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Simulation(Base):
    __tablename__ = "simulations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    dem_id: Mapped[int | None] = mapped_column(ForeignKey("datasets.id"), nullable=True)
    dam: Mapped[str] = mapped_column(String(100))
    model: Mapped[str] = mapped_column(String(30), default="basic")
    status: Mapped[str] = mapped_column(String(30), default="queued")
    water_level: Mapped[float] = mapped_column(Float)
    reservoir_volume: Mapped[float] = mapped_column(Float)
    breach_width: Mapped[float] = mapped_column(Float)
    breach_time: Mapped[float] = mapped_column(Float)
    duration_hours: Mapped[float] = mapped_column(Float)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SimulationResult(Base):
    __tablename__ = "simulation_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    simulation_id: Mapped[int] = mapped_column(ForeignKey("simulations.id"), unique=True, index=True)
    max_depth: Mapped[float] = mapped_column(Float)
    mean_depth: Mapped[float] = mapped_column(Float)
    max_velocity: Mapped[float] = mapped_column(Float)
    arrival_time_minutes: Mapped[float] = mapped_column(Float)
    inundated_area_km2: Mapped[float] = mapped_column(Float)
    flooded_cells: Mapped[int] = mapped_column(Integer)
    flood_geojson_path: Mapped[str] = mapped_column(String(500))
    depth_raster_path: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
