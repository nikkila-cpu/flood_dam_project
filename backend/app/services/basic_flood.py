"""A transparent terrain-threshold flood model for the Phase 4 MVP."""

import json
import math

import numpy as np
import rasterio
from rasterio.features import shapes
from rasterio.warp import transform_geom

from ..database import RESULTS_ROOT, SessionLocal
from ..models import Dataset, Simulation, SimulationResult


def _cell_area_m2(source: rasterio.io.DatasetReader) -> float:
    x_resolution, y_resolution = abs(source.res[0]), abs(source.res[1])
    if source.crs and source.crs.is_geographic:
        latitude = (source.bounds.top + source.bounds.bottom) / 2
        return x_resolution * 111_320 * math.cos(math.radians(latitude)) * y_resolution * 110_574
    return x_resolution * y_resolution


def _find_water_surface(elevation: np.ndarray, target_volume_m3: float, cell_area: float) -> float:
    lower = float(elevation.min())
    upper = float(elevation.max()) + (target_volume_m3 / cell_area)
    for _ in range(48):
        midpoint = (lower + upper) / 2
        simulated_volume = float(np.maximum(0, midpoint - elevation).sum()) * cell_area
        if simulated_volume < target_volume_m3:
            lower = midpoint
        else:
            upper = midpoint
    return upper


def generate_basic_flood(simulation: Simulation, dataset: Dataset) -> dict:
    output_prefix = RESULTS_ROOT / f"simulation_{simulation.id}"
    geojson_path = output_prefix.with_suffix(".geojson")
    depth_path = output_prefix.with_name(f"{output_prefix.name}_depth.tif")
    with rasterio.open(dataset.file_path) as source:
        raw_elevation = source.read(1, masked=True)
        valid_values = raw_elevation.compressed().astype(np.float64)
        if valid_values.size == 0:
            raise ValueError("The selected DEM has no valid elevation pixels")
        cell_area = _cell_area_m2(source)
        water_surface = _find_water_surface(valid_values, simulation.reservoir_volume * 1_000_000, cell_area)
        depth = np.maximum(0, water_surface - raw_elevation.filled(np.nan)).astype("float32")
        mask = np.isfinite(depth) & (depth > 0.01)
        if not mask.any():
            raise ValueError("The selected scenario does not inundate any valid DEM cells")
        profile = source.profile.copy()
        profile.update(driver="GTiff", count=1, dtype="float32", nodata=-9999.0, compress="deflate")
        with rasterio.open(depth_path, "w", **profile) as destination:
            destination.write(np.where(np.isfinite(depth), depth, -9999.0).astype("float32"), 1)
        features = []
        for geometry, _ in shapes(mask.astype("uint8"), mask=mask, transform=source.transform):
            if source.crs and str(source.crs) != "EPSG:4326":
                geometry = transform_geom(source.crs, "EPSG:4326", geometry)
            features.append({"type": "Feature", "properties": {"simulation_id": simulation.id}, "geometry": geometry})
        geojson_path.write_text(json.dumps({"type": "FeatureCollection", "features": features}), encoding="utf-8")
    flooded_depth = depth[mask]
    max_depth = float(np.max(flooded_depth))
    velocity = min(20.0, math.sqrt(2 * 9.81 * max_depth) * min(1.0, simulation.breach_width / 150))
    arrival_time = min(simulation.duration_hours * 60, max(1.0, math.sqrt(mask.sum() * cell_area) / max(velocity, 0.1) / 60))
    return {
        "max_depth": round(max_depth, 3), "mean_depth": round(float(np.mean(flooded_depth)), 3),
        "max_velocity": round(velocity, 3), "arrival_time_minutes": round(arrival_time, 2),
        "inundated_area_km2": round((int(mask.sum()) * cell_area) / 1_000_000, 5), "flooded_cells": int(mask.sum()),
        "flood_geojson_path": str(geojson_path), "depth_raster_path": str(depth_path),
    }


def run_basic_simulation(simulation_id: int) -> None:
    db = SessionLocal()
    try:
        simulation = db.get(Simulation, simulation_id)
        if not simulation:
            return
        dataset = db.get(Dataset, simulation.dem_id) if simulation.dem_id else None
        if not dataset or dataset.kind != "dem":
            raise ValueError("A valid DEM dataset is required before the simulation can run")
        simulation.status, simulation.progress, simulation.error_message = "running", 20, None
        db.commit()
        result_data = generate_basic_flood(simulation, dataset)
        simulation.progress = 85
        db.commit()
        previous = db.query(SimulationResult).filter(SimulationResult.simulation_id == simulation.id).one_or_none()
        if previous:
            for field, value in result_data.items():
                setattr(previous, field, value)
        else:
            db.add(SimulationResult(simulation_id=simulation.id, **result_data))
        simulation.status, simulation.progress = "completed", 100
        db.commit()
    except Exception as error:
        db.rollback()
        simulation = db.get(Simulation, simulation_id)
        if simulation:
            simulation.status, simulation.progress, simulation.error_message = "failed", 0, str(error)
            db.commit()
    finally:
        db.close()
