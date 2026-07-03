from app.schemas import AskResponse, Citation, DocumentSummary


DEMO_DOCUMENTS = [
    DocumentSummary(
        id="doc-render",
        title="Render Deploy Runbook",
        file_name="render-deploy-runbook.md",
        file_type="md",
        tags=["deploy", "render"],
        status="indexed",
        chunk_count=4,
    ),
    DocumentSummary(
        id="doc-fastapi",
        title="FastAPI API Guide",
        file_name="fastapi-api-guide.md",
        file_type="md",
        tags=["api", "python"],
        status="indexed",
        chunk_count=3,
    ),
]

DEMO_CITATION = Citation(
    document_id="doc-render",
    document_title="Render Deploy Runbook",
    content="Inspect runtime logs, start command, environment variables, and port binding.",
    similarity=0.91,
    chunk_index=0,
)


def demo_answer(question: str) -> AskResponse:
    return AskResponse(
        answer=(
            "Demo mode answer: the live RAG dependencies are not available right now, "
            "so use the Render deploy runbook guidance first. Check runtime logs, verify "
            "the start command, confirm all required environment variables are set, and "
            f"then retry the deployment. Question: {question}"
        ),
        citations=[DEMO_CITATION],
    )
