from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.chat_client import ChatClient
from app.chunking import chunk_text
from app.demo_data import DEMO_DOCUMENTS, demo_answer
from app.embeddings import EmbeddingClient
from app.files import extract_text, validate_upload_name
from app.rag import RagService
from app.schemas import AskRequest, AskResponse, DocumentSummary, HealthResponse
from app.settings import Settings, get_settings
from app.supabase_repo import SupabaseRepo


def create_app() -> FastAPI:
    app = FastAPI(title="KnowledgeOps RAG API")
    settings = get_settings()

    @app.get("/api/health", response_model=HealthResponse)
    async def health(current: Settings = Depends(get_settings)) -> HealthResponse:
        return HealthResponse(
            status="ok",
            chat_model=current.openai_model,
            embedding_model=current.dashscope_embedding_model,
            embedding_dimensions=current.dashscope_embedding_dimensions,
        )

    @app.get("/api/documents", response_model=list[DocumentSummary])
    async def list_documents(current: Settings = Depends(get_settings)) -> list[DocumentSummary]:
        try:
            repo = SupabaseRepo(current)
            return [DocumentSummary(**item) for item in await repo.list_documents()]
        except Exception:
            return DEMO_DOCUMENTS

    @app.post("/api/documents", response_model=DocumentSummary)
    async def upload_document(
        file: UploadFile = File(...),
        tags: str = Form(default=""),
        save_original: bool = Form(default=False),
        current: Settings = Depends(get_settings),
    ) -> DocumentSummary:
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be 5 MB or less.")

        try:
            file_type = validate_upload_name(file.filename or "")
            text = extract_text(file.filename or "", content)
            chunks = chunk_text(text)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        if not chunks:
            raise HTTPException(status_code=400, detail="No readable text was found in this file.")
        if len(chunks) > 80:
            raise HTTPException(status_code=400, detail="File produced too many chunks for this public demo.")

        embeddings = await EmbeddingClient(current).embed_texts(chunks)
        repo = SupabaseRepo(current)

        storage_path = None
        if save_original:
            safe_name = (file.filename or "untitled").replace("/", "-")
            storage_path = f"uploads/{safe_name}"
            await repo.upload_original_file(
                storage_path=storage_path,
                content=content,
                content_type=file.content_type or "application/octet-stream",
            )

        document = await repo.create_document_with_chunks(
            title=(file.filename or "Untitled").rsplit(".", 1)[0],
            file_name=file.filename or "untitled",
            file_type=file_type,
            tags=[tag.strip() for tag in tags.split(",") if tag.strip()],
            chunks=chunks,
            embeddings=embeddings,
            storage_path=storage_path,
        )
        return DocumentSummary(**document)

    @app.delete("/api/documents/{document_id}", status_code=204)
    async def delete_document(document_id: str, current: Settings = Depends(get_settings)) -> None:
        repo = SupabaseRepo(current)
        await repo.delete_document(document_id)

    @app.post("/api/reset", status_code=204)
    async def reset_demo(current: Settings = Depends(get_settings)) -> None:
        repo = SupabaseRepo(current)
        await repo.reset_demo()

    @app.post("/api/ask", response_model=AskResponse)
    async def ask(request: AskRequest, current: Settings = Depends(get_settings)) -> AskResponse:
        try:
            service = RagService(
                embeddings=EmbeddingClient(current),
                repo=SupabaseRepo(current),
                chat=ChatClient(current),
            )
            return await service.answer_question(request.question, request.match_count)
        except Exception:
            return demo_answer(request.question)

    return CORSMiddleware(
        app=app,
        allow_origins=settings.origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


app = create_app()
