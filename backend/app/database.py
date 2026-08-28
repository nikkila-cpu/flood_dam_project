import os
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./floodsim.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


UPLOAD_ROOT = Path(os.getenv("UPLOAD_ROOT", "./uploads"))
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
RESULTS_ROOT = Path(os.getenv("RESULTS_ROOT", "./results"))
RESULTS_ROOT.mkdir(parents=True, exist_ok=True)


def upgrade_local_schema():
    """Add columns introduced after the initial SQLite database was created."""
    if not DATABASE_URL.startswith("sqlite"):
        return
    with engine.begin() as connection:
        dataset_columns = {column["name"] for column in inspect(engine).get_columns("datasets")}
        if "metadata_json" not in dataset_columns:
            connection.execute(text("ALTER TABLE datasets ADD COLUMN metadata_json TEXT"))
        simulation_columns = {column["name"] for column in inspect(engine).get_columns("simulations")}
        if "dem_id" not in simulation_columns:
            connection.execute(text("ALTER TABLE simulations ADD COLUMN dem_id INTEGER"))
        if "error_message" not in simulation_columns:
            connection.execute(text("ALTER TABLE simulations ADD COLUMN error_message TEXT"))
