import type { Citation, DocumentSummary } from './types';

export const fallbackDocuments: DocumentSummary[] = [
  {
    id: 'doc-render',
    title: 'Render Deploy Runbook',
    file_name: 'render-deploy-runbook.md',
    file_type: 'md',
    tags: ['deploy', 'render'],
    status: 'indexed',
    chunk_count: 4
  },
  {
    id: 'doc-fastapi',
    title: 'FastAPI API Guide',
    file_name: 'fastapi-api-guide.md',
    file_type: 'md',
    tags: ['api', 'python'],
    status: 'indexed',
    chunk_count: 3
  }
];

export const fallbackCitations: Citation[] = [
  {
    document_id: 'doc-render',
    document_title: 'Render Deploy Runbook',
    content: 'Inspect runtime logs, start command, environment variables, and port binding.',
    similarity: 0.91,
    chunk_index: 0
  }
];
