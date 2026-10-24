"""WindScope Backend Main Application.

FastAPI web application exposing analytics and day-ahead wind generation evaluation.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router

app = FastAPI(
    title="WindScope API",
    description="UK Electricity Day-Ahead Wind Generation Forecast Evaluation Engine",
    version="1.0.0"
)

# Enable CORS for local development (Vite port 5173 / 3000) and production domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local dev and deployed frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to WindScope API. Use /api/overview or /docs for API documentation.",
        "status": "online"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
