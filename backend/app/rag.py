from app.schemas import AskResponse, Citation


class RagService:
    def __init__(self, embeddings, repo, chat):
        self.embeddings = embeddings
        self.repo = repo
        self.chat = chat

    async def answer_question(self, question: str, match_count: int = 5) -> AskResponse:
        query_embedding = (await self.embeddings.embed_texts([question]))[0]
        matches = await self.repo.match_chunks(
            query_embedding,
            match_count=match_count,
            similarity_threshold=0.2,
        )
        if not matches:
            answer = "I do not have enough indexed context to answer that question yet."
            await self.repo.save_chat(question, answer, [])
            return AskResponse(answer=answer, citations=[])

        answer = await self.chat.answer(question, matches)
        citations = [Citation(**item) for item in matches]
        await self.repo.save_chat(question, answer, [citation.model_dump() for citation in citations])
        return AskResponse(answer=answer, citations=citations)
