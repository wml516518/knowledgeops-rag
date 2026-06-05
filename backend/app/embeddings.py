import httpx

from app.settings import Settings


class EmbeddingClient:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not self.settings.dashscope_api_key:
            raise RuntimeError("DASHSCOPE_API_KEY is not configured on the backend.")

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.settings.dashscope_base_url.rstrip('/')}/embeddings",
                headers={"Authorization": f"Bearer {self.settings.dashscope_api_key}"},
                json={
                    "model": self.settings.dashscope_embedding_model,
                    "input": texts,
                    "dimensions": self.settings.dashscope_embedding_dimensions,
                },
            )
            response.raise_for_status()
            payload = response.json()
            return [item["embedding"] for item in payload["data"]]
