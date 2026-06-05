from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_model_and_embedding_settings():
    client = TestClient(app)

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "chat_model": "deepseek-V4-flash",
        "embedding_model": "text-embedding-v4",
        "embedding_dimensions": 1024,
    }
