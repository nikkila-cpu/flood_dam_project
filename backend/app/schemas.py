from datetime import datetime

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=3, max_length=150)
    description: str | None = None
    river: str | None = None
    dam: str | None = None


class ProjectRead(ProjectCreate):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DatasetRead(BaseModel):
    id: int
    name: str
    kind: str
    filename: str
    size_bytes: int
    crs: str | None
    metadata_json: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SimulationCreate(BaseModel):
    project_id: int
    dem_id: int | None = None
    dam: str = Field(min_length=2, max_length=100)
    model: str = Field(default="basic", pattern="^(basic|delft3d|sph)$")
    water_level: float = Field(gt=0)
    reservoir_volume: float = Field(gt=0)
    breach_width: float = Field(gt=0)
    breach_time: float = Field(gt=0)
    duration_hours: float = Field(gt=0, le=720)


class SimulationRead(SimulationCreate):
    id: int
    dem_id: int | None = None
    status: str
    progress: int
    error_message: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SimulationResultRead(BaseModel):
    id: int
    simulation_id: int
    max_depth: float
    mean_depth: float
    max_velocity: float
    arrival_time_minutes: float
    inundated_area_km2: float
    flooded_cells: int
    flood_geojson_path: str
    depth_raster_path: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ScenarioRunCreate(BaseModel):
    project_id: int
    dem_id: int | None = None
    dam: str = Field(min_length=2, max_length=100)
    water_level: float = Field(gt=0)
    reservoir_volume: float = Field(gt=0)
    breach_width: float = Field(gt=0)
    breach_time: float = Field(gt=0)
    duration_hours: float = Field(gt=0, le=720)
