from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    chat_model: str
    embedding_model: str
    embedding_dimensions: int
