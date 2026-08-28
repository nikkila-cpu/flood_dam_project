# FloodSim API — Phase 2

Run the backend locally:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Interactive API documentation will be available at `http://127.0.0.1:8000/docs`. The React client calls this server by default; set `VITE_API_BASE_URL` if it runs elsewhere.

The development default uses SQLite so the API can start without infrastructure. Set `DATABASE_URL` to a PostgreSQL/PostGIS connection string before deployment; PostGIS geometry tables and raster processing are introduced in Phase 3.
