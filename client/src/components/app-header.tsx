import { FileText, Settings, User } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="text-white text-sm" size={16} />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">DocuMente</h1>
            <span className="text-sm text-gray-500 hidden sm:block">
              Plataforma de Documentação de Produto
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
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
