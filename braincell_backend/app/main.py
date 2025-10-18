from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes.session import router as session_router
from .database import init_db


def create_application() -> FastAPI:
    app = FastAPI(title="BrainCell Backend", version="0.1.0")

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",  # Vite dev server
            "http://localhost:5174",  # Alternate Vite port
            "http://localhost:3000",  # Alternative dev port
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    async def startup_event() -> None:
        try:
            await init_db()
        except Exception as e:
            print(f"Database init warning: {e}")

    @app.get("/health", tags=["health"])
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(session_router, prefix="/api/v1/session", tags=["session"])
    return app


app = create_application()
