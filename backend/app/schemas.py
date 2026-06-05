from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    chat_model: str
    embedding_model: str
    embedding_dimensions: int


class DocumentSummary(BaseModel):
    id: str
    title: str
    file_name: str
    file_type: str
    tags: list[str] = Field(default_factory=list)
    status: str
    chunk_count: int
    storage_path: str | None = None


class Citation(BaseModel):
    document_id: str
    document_title: str
    content: str
    similarity: float
    chunk_index: int


class AskRequest(BaseModel):
    question: str = Field(min_length=2, max_length=2000)
    match_count: int = Field(default=5, ge=1, le=8)


class AskResponse(BaseModel):
    answer: str
    citations: list[Citation]
