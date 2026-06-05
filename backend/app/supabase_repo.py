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

    async def list_documents(self) -> list[dict]:
        response = self.client.table("documents").select("*").order("created_at", desc=True).execute()
        return response.data or []

    async def upload_original_file(self, storage_path: str, content: bytes, content_type: str) -> str:
        self.client.storage.from_(self.settings.supabase_storage_bucket).upload(
            path=storage_path,
            file=content,
            file_options={"content-type": content_type, "upsert": True},
        )
        return storage_path

    async def create_document_with_chunks(
        self,
        title: str,
        file_name: str,
        file_type: str,
        tags: list[str],
        chunks: list[str],
        embeddings: list[list[float]],
        storage_path: str | None = None,
    ) -> dict:
        document = self.client.table("documents").insert(
            {
                "title": title,
                "file_name": file_name,
                "file_type": file_type,
                "tags": tags,
                "status": "indexed",
                "chunk_count": len(chunks),
                "storage_path": storage_path,
            }
        ).execute()
        document_data = document.data[0]
        rows = [
            {
                "document_id": document_data["id"],
                "content": chunk,
                "chunk_index": index,
                "token_estimate": max(1, len(chunk) // 4),
                "embedding": embedding,
            }
            for index, (chunk, embedding) in enumerate(zip(chunks, embeddings))
        ]
        if rows:
            self.client.table("document_chunks").insert(rows).execute()
        return {**document_data, "chunk_count": len(chunks)}

    async def delete_document(self, document_id: str) -> None:
        self.client.table("documents").delete().eq("id", document_id).execute()

    async def reset_demo(self) -> None:
        self.client.table("chat_sessions").delete().neq(
            "id", "00000000-0000-0000-0000-000000000000"
        ).execute()
        self.client.table("documents").delete().neq(
            "id", "00000000-0000-0000-0000-000000000000"
        ).execute()

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
