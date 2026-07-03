from fastapi.testclient import TestClient

from app.main import create_app


def test_unhandled_errors_include_cors_headers():
    app = create_app()

    @app.app.get("/boom")
    async def boom():
        raise RuntimeError("boom")

    client = TestClient(app, raise_server_exceptions=False)

    response = client.get("/boom", headers={"Origin": "http://localhost:5173"})

    assert response.status_code == 500
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
