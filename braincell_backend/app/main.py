from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes.session import router as session_router
from .api.routes.classroom import router as classroom_router
from .routers.users import router as users_router
from .database import init_db
from .config import get_settings
from .cognitive_modules.face_emotion import get_facial_model_status
from .cognitive_modules.voice_emotion import warmup_voice_model


def create_application() -> FastAPI:
    app = FastAPI(title="BrainCell Backend", version="0.1.0")

    # Configure CORS - Allow all origins in development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",  # Vite dev server
            "http://localhost:5174",  # Alternate Vite port
            "http://localhost:3000",  # Alternative dev port
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:3000",
            "http://localhost:8001",  # Backend itself
            "http://127.0.0.1:8001",
            "http://localhost:8002",  # Alternate backend port
            "http://127.0.0.1:8002",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    @app.on_event("startup")
    async def startup_event() -> None:
        try:
            print("Initializing database...")
            await init_db()
            print("✓ Database initialized")
        except Exception as e:
            print(f"Database init warning: {e}")

        # Warm up analytics models to avoid first-call slowness/timeouts
        # Temporarily disabled to debug timeout issues
        # try:
        #     settings = get_settings()
        #     # Preload facial model if available
        #     _ = get_facial_model_status(settings.emo_model_path or None)
        # except Exception as e:
        #     print(f"Facial model warmup warning: {e}")

        # try:
        #     voice_ready = warmup_voice_model()
        #     if not voice_ready:
        #         print("Voice model not available; using fallback")
        # except Exception as e:
        #     print(f"Voice model warmup warning: {e}")
        
        print("✓ Server startup complete")

    @app.get("/health", tags=["health"])
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(session_router, prefix="/api/v1/session", tags=["session"])
    app.include_router(classroom_router)  # Already has prefix in router definition
    app.include_router(users_router)  # User sync endpoint
    return app


app = create_application()
