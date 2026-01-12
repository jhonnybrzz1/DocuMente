import { FileText, Settings, User, Library } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Link } from "wouter";

export default function AppHeader() {
  return (
    <header className="bg-background shadow-sm border-b border-input sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="text-white text-sm" size={16} />
            </div>
            <h1 className="text-xl font-semibold text-foreground">DocuMente</h1>
            <span className="text-sm text-muted-foreground hidden sm:block">
              Plataforma de Documentação de Produto
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/templates">
              <Button variant="ghost" size="sm" className="flex items-center">
                <Library className="mr-2" size={16} />
                <span className="hidden sm:inline">Biblioteca</span>
              </Button>
            </Link>
            <ThemeToggle />
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Settings size={18} />
            </button>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="text-gray-600" size={14} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
