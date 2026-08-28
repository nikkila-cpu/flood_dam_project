import json
from pathlib import Path

import numpy as np
import rasterio


def inspect_dem(file_path: str | Path) -> tuple[str | None, str]:
    """Validate a raster DEM and return its CRS and display metadata."""
    try:
        with rasterio.open(file_path) as source:
            if source.count < 1:
                raise ValueError("The raster contains no elevation band")
            elevation = source.read(1, masked=True)
            valid = elevation.compressed()
            if valid.size == 0:
                raise ValueError("The DEM has no valid elevation values")
            metadata = {
                "driver": source.driver,
                "width": source.width,
                "height": source.height,
                "band_count": source.count,
                "resolution": [round(abs(source.res[0]), 8), round(abs(source.res[1]), 8)],
                "bounds": [round(value, 8) for value in source.bounds],
                "nodata": source.nodata,
                "elevation_min": round(float(np.min(valid)), 2),
                "elevation_max": round(float(np.max(valid)), 2),
                "elevation_mean": round(float(np.mean(valid)), 2),
            }
            return str(source.crs) if source.crs else None, json.dumps(metadata)
    except rasterio.errors.RasterioError as error:
        raise ValueError(f"Unable to read DEM raster: {error}") from error
