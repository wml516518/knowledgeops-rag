from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import HealthResponse
from app.settings import Settings, get_settings


def create_app() -> FastAPI:
    app = FastAPI(title="KnowledgeOps RAG API")
    settings = get_settings()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health", response_model=HealthResponse)
    async def health(current: Settings = Depends(get_settings)) -> HealthResponse:
        return HealthResponse(
            status="ok",
            chat_model=current.openai_model,
            embedding_model=current.dashscope_embedding_model,
            embedding_dimensions=current.dashscope_embedding_dimensions,
        )

    return app


app = create_app()
