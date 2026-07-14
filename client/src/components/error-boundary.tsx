import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Mensagem exibida ao usuário. Padrão genérico se omitido. */
  message?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * ErrorBoundary — captura erros de renderização em qualquer filho e exibe
 * uma UI de fallback em vez de tela branca.
 *
 * Uso:
 *   <ErrorBoundary message="Erro ao carregar esta seção.">
 *     <ComponenteQuePoderiaFalhar />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message ?? "Erro desconhecido",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private reset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const userMessage =
      this.props.message ?? "Algo deu errado ao renderizar esta página.";

    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-8 text-center">
        <AlertTriangle className="text-destructive" size={48} aria-hidden />
        <h2 className="text-xl font-semibold">{userMessage}</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {this.state.errorMessage}
        </p>
        <Button variant="outline" onClick={this.reset}>
          Tentar novamente
        </Button>
      </div>
    );
  }
}
