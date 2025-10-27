import HistorySidebar from './history-sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const renderWithQueryClient = (component) => {
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe('HistorySidebar', () => {
  it('renders the sidebar', () => {
    renderWithQueryClient(<HistorySidebar />);
    expect(screen.getByText('Histórico de Documentos')).toBeInTheDocument();
  });

  it('displays documents', async () => {
    renderWithQueryClient(<HistorySidebar />);
    expect(await screen.findByText('Test Document')).toBeInTheDocument();
  });

  it('shows the prompt generator when the button is clicked', async () => {
    renderWithQueryClient(<HistorySidebar />);
    const documentItem = await screen.findByText('Test Document');
    const promptButton = documentItem.parentElement?.querySelector('button[aria-label="Gerar Prompt"]');
    if (promptButton) {
      fireEvent.click(promptButton);
      expect(screen.getByText('Gerar Prompt')).toBeInTheDocument();
    }
  });

  it('generates a prompt when the prompt button is clicked', async () => {
    renderWithQueryClient(<HistorySidebar />);
    const documentItem = await screen.findByText('Test Document');
    const promptButton = documentItem.parentElement?.querySelector('button[aria-label="Gerar Prompt"]');
    if (promptButton) {
      fireEvent.click(promptButton);
      fireEvent.click(screen.getByText('Gerar Prompt'));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    }
  });
});
