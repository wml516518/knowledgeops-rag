import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

describe('App', () => {
  it('renders the KnowledgeOps dashboard shell', async () => {
    render(<App />);

    expect(screen.getByText('KnowledgeOps')).toBeInTheDocument();
    expect(screen.getByText('Engineering knowledge base')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Upload docs/i })).toBeInTheDocument();
  });
});
