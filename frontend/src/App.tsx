import {
  Database,
  FileText,
  History,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Search,
  Upload
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { askQuestion, deleteDocument, listDocuments, resetDemoData, uploadDocument } from './api';
import { fallbackCitations, fallbackDocuments } from './mockData';
import type { AskResponse, DocumentSummary } from './types';

type WorkspaceView = 'ask' | 'documents' | 'sources' | 'history';

type HistoryEntry = {
  id: string;
  question: string;
  response: AskResponse;
  createdAt: string;
};

const views: Array<{
  id: WorkspaceView;
  label: string;
  icon: typeof MessageSquare;
}> = [
  { id: 'ask', label: 'Ask workspace', icon: MessageSquare },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'sources', label: 'Sources', icon: Database },
  { id: 'history', label: 'History', icon: History }
];

function App() {
  const [activeView, setActiveView] = useState<WorkspaceView>('ask');
  const [documents, setDocuments] = useState<DocumentSummary[]>(fallbackDocuments);
  const [question, setQuestion] = useState(
    'How should we recover when the Render API deployment fails after build?'
  );
  const [answer, setAnswer] = useState<AskResponse>({
    answer: 'Ask a question to retrieve relevant runbook chunks and generate a grounded answer.',
    citations: fallbackCitations
  });
  const [status, setStatus] = useState('demo mode');
  const [isAsking, setIsAsking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTags, setUploadTags] = useState('deploy, api');
  const [saveOriginal, setSaveOriginal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  async function refreshDocuments() {
    setStatus('syncing documents');
    try {
      const items = await listDocuments();
      setDocuments(items.length ? items : []);
      setStatus('api connected');
    } catch {
      setDocuments(fallbackDocuments);
      setStatus('demo mode');
    }
  }

  useEffect(() => {
    refreshDocuments()
      .then(() => undefined)
      .catch(() => undefined);
  }, []);

  const metrics = useMemo(() => {
    const chunkCount = documents.reduce((sum, item) => sum + item.chunk_count, 0);
    return { docs: documents.length, chunks: chunkCount, sessions: historyEntries.length };
  }, [documents, historyEntries]);

  async function handleAsk(event: FormEvent) {
    event.preventDefault();
    if (!question.trim() || isAsking) return;
    const prompt = question.trim();
    setIsAsking(true);
    try {
      const response = await askQuestion(prompt);
      setAnswer(response);
      setHistoryEntries((current) => [
        {
          id: crypto.randomUUID(),
          question: prompt,
          response,
          createdAt: new Date().toLocaleString([], {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        },
        ...current
      ]);
      setStatus('answer generated');
    } catch (error) {
      setAnswer({
        answer: error instanceof Error ? error.message : 'Question failed.',
        citations: []
      });
      setStatus('demo mode');
    } finally {
      setIsAsking(false);
    }
  }

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    if (!selectedFile || isUploading) return;
    setIsUploading(true);
    try {
      const document = await uploadDocument(selectedFile, uploadTags, saveOriginal);
      setDocuments((current) => [document, ...current.filter((item) => item.id !== document.id)]);
      setSelectedFile(null);
      setStatus('document indexed');
      setActiveView('documents');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteDocument(documentId: string) {
    const confirmed = window.confirm('Delete this document and its indexed chunks?');
    if (!confirmed) return;
    try {
      await deleteDocument(documentId);
      setDocuments((current) => current.filter((document) => document.id !== documentId));
      setStatus('document deleted');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'delete failed');
    }
  }

  async function handleResetDemo() {
    const confirmed = window.confirm('Reset all demo documents, chunks, and chat history?');
    if (!confirmed) return;
    try {
      await resetDemoData();
      setDocuments(fallbackDocuments);
      setAnswer({
        answer: 'Demo data reset. Upload documents or ask against the sample runbooks.',
        citations: fallbackCitations
      });
      setHistoryEntries([]);
      setStatus('demo reset');
      setActiveView('documents');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'reset failed');
    }
  }

  function restoreHistory(entry: HistoryEntry) {
    setQuestion(entry.question);
    setAnswer(entry.response);
    setActiveView('ask');
    setStatus('history restored');
  }

  function renderUploadForm() {
    return (
      <section className="upload-card" id="upload">
        <form onSubmit={handleUpload}>
          <div>
            <label htmlFor="document-file">Upload PDF, TXT, or Markdown</label>
            <input
              id="document-file"
              type="file"
              accept=".pdf,.txt,.md,.markdown"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <label htmlFor="document-tags">Tags</label>
            <input
              id="document-tags"
              value={uploadTags}
              onChange={(event) => setUploadTags(event.target.value)}
            />
          </div>
          <label className="storage-toggle">
            <input
              type="checkbox"
              checked={saveOriginal}
              onChange={(event) => setSaveOriginal(event.target.checked)}
            />
            Save original file
          </label>
          <button type="submit" disabled={!selectedFile || isUploading}>
            <Upload size={16} /> {isUploading ? 'Indexing' : 'Index document'}
          </button>
        </form>
      </section>
    );
  }

  function renderSources() {
    return (
      <section className="panel-grid" aria-label="Retrieved source chunks">
        {answer.citations.length ? (
          answer.citations.map((citation) => (
            <article className="source-card" key={`${citation.document_id}-${citation.chunk_index}`}>
              <div>
                <strong>{citation.document_title}</strong>
                <span>{Math.round(citation.similarity * 100)}% match · chunk {citation.chunk_index}</span>
              </div>
              <p>{citation.content}</p>
            </article>
          ))
        ) : (
          <article className="empty-state">
            <strong>No sources yet</strong>
            <p>Ask a question to retrieve matching chunks from your indexed documents.</p>
          </article>
        )}
      </section>
    );
  }

  function renderDocuments() {
    return (
      <section className="panel-grid" aria-label="Document library">
        {documents.length ? (
          documents.map((document) => (
            <article className="document-card" key={document.id}>
              <div>
                <strong>{document.title}</strong>
                <span>{document.file_type} · {document.chunk_count} chunks · {document.status}</span>
              </div>
              <div className="tag-row">
                {document.tags.length ? document.tags.map((tag) => <span key={tag}>{tag}</span>) : <span>untagged</span>}
              </div>
              <button type="button" onClick={() => handleDeleteDocument(document.id)}>
                Delete
              </button>
            </article>
          ))
        ) : (
          <article className="empty-state">
            <strong>No indexed documents</strong>
            <p>Upload a PDF, TXT, or Markdown file to build a searchable knowledge base.</p>
          </article>
        )}
      </section>
    );
  }

  function renderHistory() {
    return (
      <section className="panel-grid" aria-label="Session history">
        {historyEntries.length ? (
          historyEntries.map((entry) => (
            <article className="history-card" key={entry.id}>
              <span>{entry.createdAt}</span>
              <strong>{entry.question}</strong>
              <p>{entry.response.answer}</p>
              <button type="button" onClick={() => restoreHistory(entry)}>
                Reopen
              </button>
            </article>
          ))
        ) : (
          <article className="empty-state">
            <strong>No session history</strong>
            <p>Successful answers will appear here for quick review during this browser session.</p>
          </article>
        )}
      </section>
    );
  }

  const viewTitle = {
    ask: 'Ask deployment, API, and incident docs.',
    documents: 'Document library',
    sources: 'Retrieved sources',
    history: 'Session history'
  }[activeView];

  const viewEyebrow = {
    ask: 'Engineering knowledge base',
    documents: 'Knowledge base operations',
    sources: 'Grounding evidence',
    history: 'Question trail'
  }[activeView];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <strong>KnowledgeOps</strong>
          <span>Technical RAG Workspace</span>
        </div>
        <nav>
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <button
                className={activeView === view.id ? 'active' : ''}
                key={view.id}
                type="button"
                onClick={() => setActiveView(view.id)}
              >
                <Icon size={16} /> {view.label}
              </button>
            );
          })}
        </nav>
        <p>Netlify · Render · Supabase · DashScope</p>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p>{viewEyebrow}</p>
            <h1>{viewTitle}</h1>
          </div>
          <button className="upload-link" type="button" onClick={() => setActiveView('documents')}>
            <Upload size={17} /> Upload docs
          </button>
        </header>

        {activeView === 'ask' && (
          <>
            <section className="ask-card" id="ask">
              <form onSubmit={handleAsk}>
                <label htmlFor="question">Ask a technical question</label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                />
                <button type="submit" disabled={isAsking}>
                  <Search size={17} /> {isAsking ? 'Asking' : 'Ask'}
                </button>
              </form>
            </section>

            <section className="answer-card">
              <p>Answer preview</p>
              <article>{answer.answer}</article>
            </section>
          </>
        )}

        {activeView === 'documents' && (
          <>
            {renderUploadForm()}
            <div className="section-toolbar">
              <h2>Manage documents</h2>
              <div>
                <button type="button" onClick={refreshDocuments}>
                  <RefreshCw size={15} /> Refresh
                </button>
                <button type="button" onClick={handleResetDemo}>
                  <RotateCcw size={15} /> Reset
                </button>
              </div>
            </div>
            {renderDocuments()}
          </>
        )}

        {activeView === 'sources' && (
          <>
            <div className="section-toolbar">
              <h2>Source evidence</h2>
              <button type="button" onClick={() => setActiveView('ask')}>
                <MessageSquare size={15} /> Ask again
              </button>
            </div>
            {renderSources()}
          </>
        )}

        {activeView === 'history' && (
          <>
            <div className="section-toolbar">
              <h2>Recent answers</h2>
              <button type="button" onClick={() => setHistoryEntries([])} disabled={!historyEntries.length}>
                Clear
              </button>
            </div>
            {renderHistory()}
          </>
        )}

        <section className="metrics">
          <div>
            <strong>{metrics.docs}</strong>
            <span>documents</span>
          </div>
          <div>
            <strong>{metrics.chunks}</strong>
            <span>chunks</span>
          </div>
          <div>
            <strong>{status}</strong>
            <span>status</span>
          </div>
          <div>
            <strong>{metrics.sessions}</strong>
            <span>answers</span>
          </div>
        </section>
      </section>

      <aside className="right-panel">
        <section>
          <p>Workspace snapshot</p>
          <div className="snapshot-list">
            <button type="button" onClick={() => setActiveView('documents')}>
              <strong>{metrics.docs}</strong>
              <span>indexed documents</span>
            </button>
            <button type="button" onClick={() => setActiveView('sources')}>
              <strong>{answer.citations.length}</strong>
              <span>active citations</span>
            </button>
            <button type="button" onClick={() => setActiveView('history')}>
              <strong>{historyEntries.length}</strong>
              <span>saved answers</span>
            </button>
          </div>
        </section>

        <section>
          <p>Latest sources</p>
          {renderSources()}
        </section>

        <section>
          <p>Recent documents</p>
          {renderDocuments()}
        </section>
      </aside>
    </main>
  );
}

export default App;
