export type DocumentSummary = {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  tags: string[];
  status: string;
  chunk_count: number;
  storage_path?: string | null;
};

export type Citation = {
  document_id: string;
  document_title: string;
  content: string;
  similarity: number;
  chunk_index: number;
};

export type AskResponse = {
  answer: string;
  citations: Citation[];
};
