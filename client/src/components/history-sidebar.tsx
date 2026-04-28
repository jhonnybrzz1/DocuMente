import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Search, Download, MoreVertical, Sparkles, Edit2, Clock, Star } from "lucide-react";

// Hook de debounce para otimizar performance da busca
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
import { documentTypes, type Document } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import AiPromptModal from "./ai-prompt-modal";
import DocumentEditorModal from "./document-editor-modal";
import VersionHistoryModal from "./version-history-modal";
import ExportMenu from "./export-menu";
import FavoritesManager from "./favorites-manager";

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
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce de 300ms
  const [filterType, setFilterType] = useState<string>("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [documentForVersions, setDocumentForVersions] = useState<Document | null>(null);
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem("documente-favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const response = await fetch(`/api/documents/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update document");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Documento atualizado",
        description: "O documento foi atualizado com sucesso.",
        variant: "default",
      });
      
      // Invalidate documents list to refresh history
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Falha ao atualizar o documento.",
        variant: "destructive",
      });
    },
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["/api/documents", debouncedSearchQuery, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append("search", debouncedSearchQuery);
      if (filterType && filterType !== "all") params.append("type", filterType);

      const response = await fetch(`/api/documents?${params}`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    }
  });

  const handleGeneratePrompt = (document: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDocument(document);
    setIsPromptModalOpen(true);
  };

  const handleEditDocument = (document: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocumentToEdit(document);
    setIsEditorModalOpen(true);
  };

  const handleViewVersions = (document: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocumentForVersions(document);
    setIsVersionModalOpen(true);
  };

  const handleToggleFavorite = (documentId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCurrentlyFavorite = favorites.includes(documentId);
    
    let updatedFavorites;
    if (isCurrentlyFavorite) {
      updatedFavorites = favorites.filter(id => id !== documentId);
      toast({
        title: "Removido dos favoritos",
        description: "O documento foi removido dos seus favoritos.",
        variant: "default",
      });
    } else {
      updatedFavorites = [...favorites, documentId];
      toast({
        title: "Adicionado aos favoritos",
        description: "O documento foi adicionado aos seus favoritos.",
        variant: "default",
      });
    }

    setFavorites(updatedFavorites);
    localStorage.setItem("documente-favorites", JSON.stringify(updatedFavorites));
  };

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
  const documentsThisWeek = documents.filter((doc: Document) => {
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
        <div className="space-y-3" role="list" aria-label="Lista de documentos">
          {isLoading ? (
            <div className="text-center text-muted-foreground text-sm" role="status">
              Carregando...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm">
              {debouncedSearchQuery || filterType ? "Nenhum documento encontrado" : "Nenhum documento ainda"}
            </div>
          ) : (
            documents.map((document: Document) => (
              <article
                key={document.id}
                className="border border-border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                role="listitem"
              >
                {/* Content section */}
                <div className="mb-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${getTypeColor(document.type)}`}>
                        {getTypeLabel(document.type)}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {formatDistanceToNow(new Date(document.createdAt), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {document.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {document.originalDemand.slice(0, 50)}...
                  </p>
                </div>
                {/* Action buttons - below content */}
                <div className="flex items-center justify-end gap-0.5 pt-2 border-t border-border/50" role="group" aria-label="Ações do documento">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleViewVersions(document, e)}
                        className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                        aria-label="Ver histórico de versões"
                      >
                        <Clock size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Versões</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleEditDocument(document, e)}
                        className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                        aria-label="Editar documento"
                      >
                        <Edit2 size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleGeneratePrompt(document, e)}
                        className="h-8 w-8 text-purple-500 hover:text-purple-600 hover:bg-purple-500/10"
                        aria-label="Gerar Prompt para IA"
                      >
                        <Sparkles size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Prompt IA</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleToggleFavorite(document.id, e)}
                        className={`h-8 w-8 ${
                          favorites.includes(document.id)
                            ? "text-yellow-500 hover:text-yellow-600"
                            : "text-muted-foreground hover:text-yellow-500"
                        }`}
                        aria-label={favorites.includes(document.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        aria-pressed={favorites.includes(document.id)}
                      >
                        <Star
                          className={favorites.includes(document.id) ? "fill-current" : ""}
                          size={14}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {favorites.includes(document.id) ? "Remover favorito" : "Favoritar"}
                    </TooltipContent>
                  </Tooltip>
                  <ExportMenu
                    documentId={document.id}
                    documentTitle={document.title}
                    onExportSuccess={() => {
                      toast({
                        title: "Exportação concluída",
                        description: `Documento ${document.title} exportado com sucesso.`,
                        variant: "default",
                      });
                    }}
                  />
                </div>
              </article>
            ))
          )}
        </div>

        {/* Statistics */}
        {documents.length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {totalDocuments}
                </div>
                <div className="text-xs text-muted-foreground">Documentos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">
                  {documentsThisWeek}
                </div>
                <div className="text-xs text-muted-foreground">Esta semana</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* AI Prompt Modal */}
      <AiPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        document={selectedDocument}
      />

      {/* Document Editor Modal */}
      <DocumentEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
        onSave={async (editedContent) => {
          if (documentToEdit) {
            await updateDocumentMutation.mutateAsync({
              id: documentToEdit.id,
              content: editedContent,
            });
          }
        }}
        documentId={documentToEdit?.id || null}
        title={documentToEdit?.title || ""}
        content={documentToEdit?.content || ""}
        type={(documentToEdit?.type as any) || ""}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        onRestore={async (version) => {
          if (documentForVersions) {
            await updateDocumentMutation.mutateAsync({
              id: documentForVersions.id,
              content: version.content,
            });
          }
        }}
        documentId={documentForVersions?.id || null}
        documentTitle={documentForVersions?.title || ""}
        versions={[]} // TODO: Implement version tracking in backend
      />

      {/* Favorites Manager Modal */}
      <FavoritesManager
        documents={documents}
        onToggleFavorite={(id) => handleToggleFavorite(id)}
      />
    </Card>
  );
}
