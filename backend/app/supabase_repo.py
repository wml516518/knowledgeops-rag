from supabase import Client, create_client

from app.settings import Settings


class SupabaseRepo:
    def __init__(self, settings: Settings):
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise RuntimeError("Supabase URL and service role key are required.")
        self.settings = settings
        self.client: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)

    async def match_chunks(
        self,
        embedding: list[float],
        match_count: int = 5,
        similarity_threshold: float = 0.2,
    ) -> list[dict]:
        response = self.client.rpc(
            "match_document_chunks",
            {
                "query_embedding": embedding,
                "match_count": match_count,
                "similarity_threshold": similarity_threshold,
            },
        ).execute()
        return response.data or []

    async def save_chat(self, question: str, answer: str, citations: list[dict]) -> None:
        session = self.client.table("chat_sessions").insert({"title": question[:80]}).execute()
        session_id = session.data[0]["id"]
        self.client.table("chat_messages").insert(
            [
                {"session_id": session_id, "role": "user", "content": question, "citations": []},
                {
                    "session_id": session_id,
                    "role": "assistant",
                    "content": answer,
                    "citations": citations,
                },
            ]
        ).execute()
