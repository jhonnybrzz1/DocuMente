import { render, screen, fireEvent } from '@testing-library/react';
import PromptGeneratorButton from './prompt-generator-button';
import { describe, it, expect, vi } from 'vitest';

// Mock the useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

const mockDocument = {
  id: 1,
  title: 'Test Document',
  type: 'documentation',
  content: 'This is a test document content.',
};

describe('PromptGeneratorButton', () => {
  it('renders the button', () => {
    render(<PromptGeneratorButton document={mockDocument} />);
    expect(screen.getByText('Gerar Prompt')).toBeInTheDocument();
  });

  it('generates a prompt when the button is clicked', () => {
    render(<PromptGeneratorButton document={mockDocument} />);
    fireEvent.click(screen.getByText('Gerar Prompt'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('copies the prompt to clipboard when the copy button is clicked', async () => {
    render(<PromptGeneratorButton document={mockDocument} />);
    fireEvent.click(screen.getByText('Gerar Prompt'));
    fireEvent.click(screen.getByText('Copiar'));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('clears the prompt when the clear button is clicked', () => {
    render(<PromptGeneratorButton document={mockDocument} />);
    fireEvent.click(screen.getByText('Gerar Prompt'));
    fireEvent.click(screen.getByText('Limpar'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
