import pytest

from app.rag import RagService


class FakeEmbeddings:
    async def embed_texts(self, texts):
        return [[0.1, 0.2, 0.3] for _ in texts]


class FakeRepo:
    async def match_chunks(self, embedding, match_count, similarity_threshold):
        return [
            {
                "document_id": "doc-1",
                "document_title": "Render Runbook",
                "content": "Check Render logs and verify the start command.",
                "similarity": 0.91,
                "chunk_index": 0,
            }
        ]

    async def save_chat(self, question, answer, citations):
        return None


class FakeChat:
    async def answer(self, question, citations):
        return f"Answer grounded in {citations[0]['document_title']}: {question}"


@pytest.mark.asyncio
async def test_rag_service_returns_answer_and_citations():
    service = RagService(
        embeddings=FakeEmbeddings(),
        repo=FakeRepo(),
        chat=FakeChat(),
    )

    result = await service.answer_question("How do I fix a failed deploy?", match_count=3)

    assert result.answer.startswith("Answer grounded in Render Runbook")
    assert result.citations[0].document_title == "Render Runbook"
    assert result.citations[0].similarity == 0.91
