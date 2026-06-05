# Supabase Vector Notes

Supabase Postgres can store embeddings with the pgvector extension. For DashScope text-embedding-v4 with 1024 dimensions, define chunk embeddings as `vector(1024)`.

A retrieval function should accept the query embedding and return the most similar chunks with document titles and similarity scores. Cosine distance can be converted into similarity with `1 - (embedding <=> query_embedding)`.

Keep original documents optional. For lightweight demos, storing chunks and metadata is usually enough. Save raw files to Supabase Storage only when download or audit behavior is needed.
