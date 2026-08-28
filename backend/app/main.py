"""REST API for the FloodSim platform, Phase 2 foundation."""

import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import UPLOAD_ROOT, Base, engine, get_db, upgrade_local_schema
from .models import Dataset, Project, Simulation, SimulationResult
from .schemas import DatasetRead, ProjectCreate, ProjectRead, SimulationCreate, SimulationRead
from .services.basic_flood import run_basic_simulation
from .services.dem_processor import inspect_dem

Base.metadata.create_all(bind=engine)
upgrade_local_schema()

app = FastAPI(title="FloodSim API", version="0.2.0", description="Dam-break flood analysis platform")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {
    "dem": {".tif", ".tiff", ".asc"},
    "hydrological": {".csv", ".json"},
    "vector": {".geojson", ".json", ".kml", ".shp"},
}


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "floodsim-api"}


@app.get("/")
def api_home():
    return {
        "name": "FloodSim API",
        "version": app.version,
        "status": "running",
        "documentation": "/docs",
        "health": "/health",
    }


@app.post("/api/projects", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    if db.scalar(select(Project).where(Project.name == payload.name)):
        raise HTTPException(status_code=409, detail="A project with this name already exists")
    project = Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@app.get("/api/projects", response_model=list[ProjectRead])
def list_projects(db: Session = Depends(get_db)):
    return db.scalars(select(Project).order_by(Project.created_at.desc())).all()


@app.post("/api/datasets/upload", response_model=DatasetRead, status_code=status.HTTP_201_CREATED)
def upload_dataset(kind: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if kind not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=422, detail=f"Unsupported dataset type: {kind}")
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS[kind]:
        raise HTTPException(status_code=415, detail=f"{kind} files must be one of {sorted(ALLOWED_EXTENSIONS[kind])}")
    stored_name = f"{uuid4().hex}{suffix}"
    destination = UPLOAD_ROOT / stored_name
    with destination.open("wb") as output:
        shutil.copyfileobj(file.file, output)
    crs = metadata_json = None
    if kind == "dem":
        try:
            crs, metadata_json = inspect_dem(destination)
        except ValueError as error:
            destination.unlink(missing_ok=True)
            raise HTTPException(status_code=422, detail=str(error)) from error
    dataset = Dataset(name=Path(file.filename or stored_name).stem, kind=kind, filename=file.filename or stored_name, file_path=str(destination), size_bytes=destination.stat().st_size, crs=crs, metadata_json=metadata_json)
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset


@app.get("/api/datasets", response_model=list[DatasetRead])
def list_datasets(db: Session = Depends(get_db)):
    return db.scalars(select(Dataset).order_by(Dataset.created_at.desc())).all()


@app.post("/api/simulations", response_model=SimulationRead, status_code=status.HTTP_201_CREATED)
def create_simulation(payload: SimulationCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if not db.get(Project, payload.project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    if payload.model != "basic":
        raise HTTPException(status_code=422, detail="Only the basic flood model is available in this phase")
    dem = db.get(Dataset, payload.dem_id) if payload.dem_id else db.scalar(select(Dataset).where(Dataset.kind == "dem").order_by(Dataset.created_at.desc()))
    if not dem or dem.kind != "dem":
        raise HTTPException(status_code=422, detail="Upload a valid DEM before creating a simulation")
    simulation = Simulation(**payload.model_dump())
    simulation.dem_id = dem.id
    db.add(simulation)
    db.commit()
    db.refresh(simulation)
    background_tasks.add_task(run_basic_simulation, simulation.id)
    return simulation


@app.get("/api/simulations", response_model=list[SimulationRead])
def list_simulations(db: Session = Depends(get_db)):
    return db.scalars(select(Simulation).order_by(Simulation.created_at.desc())).all()


@app.get("/api/simulations/{simulation_id}", response_model=SimulationRead)
def get_simulation(simulation_id: int, db: Session = Depends(get_db)):
    simulation = db.get(Simulation, simulation_id)
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return simulation


@app.get("/api/simulations/{simulation_id}/status")
def get_simulation_status(simulation_id: int, db: Session = Depends(get_db)):
    simulation = db.get(Simulation, simulation_id)
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return {"simulation_id": simulation.id, "status": simulation.status, "progress": simulation.progress}


@app.get("/api/simulations/{simulation_id}/result")
def get_simulation_result(simulation_id: int, db: Session = Depends(get_db)):
    if not db.get(Simulation, simulation_id):
        raise HTTPException(status_code=404, detail="Simulation not found")
    result = db.scalar(select(SimulationResult).where(SimulationResult.simulation_id == simulation_id))
    if not result:
        raise HTTPException(status_code=404, detail="Simulation result is not ready")
    return result
