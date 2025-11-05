import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, Download, MoreVertical } from "lucide-react";
import { documentTypes, type Document } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const getTypeColor = (type: string) => {
  const docType = documentTypes.find(dt => dt.value === type);
  const colorMap = {
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
    green: "bg-green-100 text-green-800",
    orange: "bg-orange-100 text-orange-800",
    indigo: "bg-indigo-100 text-indigo-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
    yellow: "bg-yellow-100 text-yellow-800",
    teal: "bg-teal-100 text-teal-800",
  };
  return colorMap[docType?.color as keyof typeof colorMap] || "bg-gray-100 text-gray-800";
};

const getTypeLabel = (type: string) => {
  const docType = documentTypes.find(dt => dt.value === type);
  return docType?.label || type;
};

export default function HistorySidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const { toast } = useToast();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["/api/documents", searchQuery, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filterType && filterType !== "all") params.append("type", filterType);
      
      const response = await fetch(`/api/documents?${params}`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    }
  });

  const handleDownload = async (document: Document, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const response = await fetch(`/api/documents/${document.id}/download`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("Documento vazio");
      }

      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document.title}.docx`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download iniciado",
        description: "O documento está sendo baixado.",
        variant: "default",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Erro no download",
        description: error instanceof Error ? error.message : "Falha ao baixar o documento.",
        variant: "destructive",
      });
    }
  };

  const totalDocuments = documents.length;
  const documentsThisWeek = documents.filter(doc => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(doc.createdAt) > weekAgo;
  }).length;

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Histórico</span>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <MoreVertical size={16} />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Buscar documentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {documentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document History List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center text-gray-500 text-sm">
              Carregando...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center text-gray-500 text-sm">
              {searchQuery || filterType ? "Nenhum documento encontrado" : "Nenhum documento ainda"}
            </div>
          ) : (
            documents.map((document) => (
              <div
                key={document.id}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(document.type)}`}>
                        {getTypeLabel(document.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(document.createdAt), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {document.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {document.originalDemand.slice(0, 60)}...
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDownload(document, e)}
                    className="text-gray-400 hover:text-gray-600 ml-2 p-1"
                  >
                    <Download size={12} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Statistics */}
        {documents.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {totalDocuments}
                </div>
                <div className="text-xs text-gray-500">Documentos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">
                  {documentsThisWeek}
                </div>
                <div className="text-xs text-gray-500">Esta semana</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
