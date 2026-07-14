import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/error-boundary";
import Home from "@/pages/home";
import TemplatesPage from "@/pages/templates";
import StatsPage from "@/pages/stats";
import SharePage from "@/pages/share";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <ErrorBoundary message="Erro ao carregar a página principal.">
          <Home />
        </ErrorBoundary>
      )} />
      <Route path="/templates" component={() => (
        <ErrorBoundary message="Erro ao carregar os templates.">
          <TemplatesPage />
        </ErrorBoundary>
      )} />
      <Route path="/stats" component={() => (
        <ErrorBoundary message="Erro ao carregar as estatísticas.">
          <StatsPage />
        </ErrorBoundary>
      )} />
      <Route path="/share/:token" component={() => (
        <ErrorBoundary message="Erro ao carregar o documento compartilhado.">
          <SharePage />
        </ErrorBoundary>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <ErrorBoundary message="Erro crítico na aplicação. Recarregue a página.">
            <Router />
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
