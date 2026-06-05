import httpx

from app.settings import Settings


class ChatClient:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def answer(self, question: str, citations: list[dict]) -> str:
        if not self.settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured on the backend.")

        context = "\n\n".join(
            f"Source {index + 1}: {item['document_title']}\n{item['content']}"
            for index, item in enumerate(citations)
        )
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a technical knowledge base assistant. "
                    "Answer only from the provided sources. If the sources are insufficient, say so clearly."
                ),
            },
            {"role": "user", "content": f"Question: {question}\n\nSources:\n{context}"},
        ]

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.settings.openai_base_url.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {self.settings.openai_api_key}"},
                json={"model": self.settings.openai_model, "messages": messages},
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
