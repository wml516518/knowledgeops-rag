from fastapi.testclient import TestClient

from app.main import create_app


def test_documents_fall_back_to_demo_data_when_repo_is_unavailable():
    client = TestClient(create_app(), raise_server_exceptions=False)

    response = client.get("/api/documents")

    assert response.status_code == 200
    assert response.json()[0]["id"] == "doc-render"


def test_ask_falls_back_to_demo_answer_when_rag_dependencies_are_unavailable():
    client = TestClient(create_app(), raise_server_exceptions=False)

    response = client.post("/api/ask", json={"question": "How do I recover a failed deploy?"})

    assert response.status_code == 200
    payload = response.json()
    assert "demo mode" in payload["answer"].lower()
    assert payload["citations"][0]["document_id"] == "doc-render"
