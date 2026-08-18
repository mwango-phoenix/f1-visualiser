# Entry point. Wires together the FastAPI app, middleware, and routers.
# Run with: uvicorn main:app --reload

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.track import router as track_router

app = FastAPI(
    title="F1 Track Visualizer API",
    description="Serves track outlines and per-driver position data from OpenF1.",
    version="1.0.0",
)

# Allow the frontend to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(track_router)


# FastAPI auto-generates interactive docs at:
#   http://localhost:8000/docs   (Swagger UI)
#   http://localhost:8000/redoc  (ReDoc)