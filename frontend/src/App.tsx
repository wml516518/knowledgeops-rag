import { Database, FileText, History, MessageSquare, RotateCcw, Search, Upload } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { askQuestion, listDocuments } from './api';
import { fallbackCitations, fallbackDocuments } from './mockData';
import type { AskResponse, DocumentSummary } from './types';

function App() {
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

  useEffect(() => {
    listDocuments()
      .then((items) => {
        setDocuments(items.length ? items : fallbackDocuments);
        setStatus('api connected');
      })
      .catch(() => setStatus('demo mode'));
  }, []);

  const metrics = useMemo(() => {
    const chunkCount = documents.reduce((sum, item) => sum + item.chunk_count, 0);
    return { docs: documents.length, chunks: chunkCount };
  }, [documents]);

  async function handleAsk(event: FormEvent) {
    event.preventDefault();
    if (!question.trim() || isAsking) return;
    setIsAsking(true);
    try {
      const response = await askQuestion(question.trim());
      setAnswer(response);
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

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <strong>KnowledgeOps</strong>
          <span>Technical RAG Demo</span>
        </div>
        <nav>
          <a className="active" href="#ask">
            <MessageSquare size={16} /> Ask workspace
          </a>
          <a href="#documents">
            <FileText size={16} /> Documents
          </a>
          <a href="#sources">
            <Database size={16} /> Sources
          </a>
          <a href="#history">
            <History size={16} /> History
          </a>
        </nav>
        <p>Netlify · Render · Supabase · DashScope</p>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p>Engineering knowledge base</p>
            <h1>Ask deployment, API, and incident docs.</h1>
          </div>
          <button type="button">
            <Upload size={17} /> Upload docs
          </button>
        </header>

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
        </section>
      </section>

      <aside className="right-panel">
        <section id="sources">
          <p>Cited sources</p>
          <div className="source-list">
            {answer.citations.map((citation) => (
              <article key={`${citation.document_id}-${citation.chunk_index}`}>
                <strong>{citation.document_title}</strong>
                <span>{Math.round(citation.similarity * 100)}% match</span>
                <p>{citation.content}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="documents">
          <p>Recent documents</p>
          <div className="doc-list">
            {documents.map((document) => (
              <article key={document.id}>
                <strong>{document.title}</strong>
                <span>
                  {document.file_type} · {document.chunk_count} chunks
                </span>
              </article>
            ))}
          </div>
        </section>

        <button className="reset-button" type="button">
          <RotateCcw size={15} /> Reset demo data
        </button>
      </aside>
    </main>
  );
}

export default App;
