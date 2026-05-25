import { FileText, Settings, User, Library, BarChart3 } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";

export default function AppHeader() {
  const [location] = useLocation();

  return (
    <>
      {/* Skip Link para acessibilidade */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
      >
        Pular para o conteúdo principal
      </a>

      <header className="bg-background shadow-sm border-b border-input sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <div className="flex items-center space-x-3 cursor-pointer">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <FileText className="text-white text-sm" size={16} />
                  </div>
                  <h1 className="text-xl font-semibold text-foreground">DocuMente</h1>
                </div>
              </Link>
              <span className="text-sm text-muted-foreground hidden sm:block">
                Plataforma de Documentação de Produto
              </span>
            </div>
            <nav className="flex items-center space-x-2" aria-label="Navegação principal">
              <Link href="/">
                <Button
                  variant={location === "/" ? "secondary" : "ghost"}
                  size="sm"
                  className={`flex items-center min-h-[44px] min-w-[44px] ${location === "/" ? "bg-secondary" : ""}`}
                  aria-current={location === "/" ? "page" : undefined}
                >
                  <FileText className="mr-2" size={16} />
                  <span className="hidden sm:inline">Início</span>
                </Button>
              </Link>
              <Link href="/templates">
                <Button
                  variant={location === "/templates" ? "secondary" : "ghost"}
                  size="sm"
                  className={`flex items-center min-h-[44px] min-w-[44px] ${location === "/templates" ? "bg-secondary" : ""}`}
                  aria-current={location === "/templates" ? "page" : undefined}
                >
                  <Library className="mr-2" size={16} />
                  <span className="hidden sm:inline">Biblioteca</span>
                </Button>
              </Link>
              <Link href="/stats">
                <Button
                  variant={location === "/stats" ? "secondary" : "ghost"}
                  size="sm"
                  className={`flex items-center min-h-[44px] min-w-[44px] ${location === "/stats" ? "bg-secondary" : ""}`}
                  aria-current={location === "/stats" ? "page" : undefined}
                >
                  <BarChart3 className="mr-2" size={16} />
                  <span className="hidden sm:inline">Stats</span>
                </Button>
              </Link>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground"
                aria-label="Configurações"
              >
                <Settings size={18} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] min-w-[44px] p-0"
                aria-label="Menu do usuário"
              >
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <User className="text-muted-foreground" size={14} />
                </div>
              </Button>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
