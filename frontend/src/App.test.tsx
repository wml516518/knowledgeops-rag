import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

describe('App', () => {
  it('renders the KnowledgeOps dashboard shell', async () => {
    render(<App />);

    expect(screen.getByText('KnowledgeOps')).toBeInTheDocument();
    expect(screen.getByText('Engineering knowledge base')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload docs/i })).toBeInTheDocument();
    expect(await screen.findByText('demo mode')).toBeInTheDocument();
  });

  it('switches between document, source, and history workspaces', async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByRole('navigation');

    await user.click(within(navigation).getByRole('button', { name: /Documents/i }));
    expect(screen.getByRole('heading', { name: /Document library/i })).toBeInTheDocument();

    await user.click(within(navigation).getByRole('button', { name: /Sources/i }));
    expect(screen.getByRole('heading', { name: /Retrieved sources/i })).toBeInTheDocument();

    await user.click(within(navigation).getByRole('button', { name: /History/i }));
    expect(screen.getByRole('heading', { name: /Session history/i })).toBeInTheDocument();
  });

  it('stores successful answers in session history', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          answer: 'Restart the Render service and inspect deployment logs.',
          citations: [
            {
              document_id: 'doc-render',
              document_title: 'Render Deploy Runbook',
              content: 'Check build logs, runtime logs, and health checks.',
              similarity: 0.91,
              chunk_index: 1
            }
          ]
        })
      } as Response);

    render(<App />);
    const navigation = screen.getByRole('navigation');

    await user.click(screen.getByRole('button', { name: /^Ask$/i }));
    expect(await screen.findByText(/Restart the Render service/i)).toBeInTheDocument();

    await user.click(within(navigation).getByRole('button', { name: /History/i }));

    expect(screen.getByText(/Restart the Render service/i)).toBeInTheDocument();
    expect(screen.getByText(/How should we recover/i)).toBeInTheDocument();
  });
});
