from fastapi.testclient import TestClient

from app.main import create_app


def test_unhandled_errors_include_cors_headers():
    client = TestClient(create_app(), raise_server_exceptions=False)

    response = client.get("/api/documents", headers={"Origin": "http://localhost:5173"})

    assert response.status_code == 500
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
