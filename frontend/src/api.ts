import type { AskResponse, DocumentSummary } from './types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}${path}`, init);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function listDocuments(): Promise<DocumentSummary[]> {
  return request<DocumentSummary[]>('/api/documents');
}

export function askQuestion(question: string): Promise<AskResponse> {
  return request<AskResponse>('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
}

export function uploadDocument(
  file: File,
  tags: string,
  saveOriginal: boolean
): Promise<DocumentSummary> {
  const body = new FormData();
  body.append('file', file);
  body.append('tags', tags);
  body.append('save_original', String(saveOriginal));
  return request<DocumentSummary>('/api/documents', {
    method: 'POST',
    body
  });
}

export function deleteDocument(documentId: string): Promise<void> {
  return request<void>(`/api/documents/${documentId}`, { method: 'DELETE' });
}

export function resetDemoData(): Promise<void> {
  return request<void>('/api/reset', { method: 'POST' });
}
