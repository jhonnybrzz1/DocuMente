

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, ChevronDown, ChevronUp, Loader2, Plus, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { documentTypes, type Document } from "@shared/schema";
import EditModal from "./edit-modal";

interface DocumentItemProps {
  document: {
    id: number;
    title: string;
    type: string;
    createdAt: string;
  };
  isExpanded: boolean;
  onToggleVersions: (id: number) => void;
  onDownload: (id: number) => void;
  onDelete: (id: number) => void;
  onCorrect: (id: number) => void;
  onEdit: (id: number) => void;
  onGenerateAIPrompt: (id: number) => void;
}

function DocumentItem({ document, isExpanded, onToggleVersions, onDownload, onDelete, onEdit, onGenerateAIPrompt }: DocumentItemProps) {
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ["/api/documents", document.id, "versions"],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${document.id}/versions`);
      if (!response.ok) throw new Error("Failed to fetch document versions");
      return response.json();
    },
    enabled: isExpanded,
  });

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{document.title}</h4>
          <p className="text-xs text-gray-500">
            {new Date(document.createdAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {documentTypes[document.type as keyof typeof documentTypes]?.label || document.type}
          </Badge>
          <Button
            onClick={() => onDownload(document.id)}
            variant="ghost"
            size="icon"
            className="h-6 w-6"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => onGenerateAIPrompt(document.id)}
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="Gerar prompt com IA"
          >
            <Bot className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => onEdit(document.id)}
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="Editar documento"
          >
            📝
          </Button>
          <Button
            onClick={() => onDelete(document.id)}
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => onToggleVersions(document.id)}
            variant="ghost"
            size="icon"
            className="h-6 w-6"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2 ml-4 border-l border-gray-200 pl-2">
          {versionsLoading ? (
            <p className="text-xs text-gray-500">Carregando versões...</p>
          ) : versions.length > 0 ? (
            <ul className="space-y-1">
              {versions.map((version) => (
                <li key={version.id} className="text-xs text-gray-600 flex items-center justify-between">
                  <span>Versão {version.version} - {new Date(version.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</span>
                  <Button
                    onClick={() => onDownload(version.id)}
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">Nenhuma versão encontrada</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistorySidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionText, setCorrectionText] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);

  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/documents", searchQuery, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filterType && filterType !== "all") params.append("type", filterType);

      const response = await fetch(`/api/documents?${params}`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete document");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Documento excluído",
        description: "O documento foi excluído com sucesso.",
        variant: "default",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Falha ao excluir documento.",
        variant: "destructive",
      });
    },
  });

  const toggleVersions = (documentId: number) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(documentId)) {
      newExpanded.delete(documentId);
    } else {
      newExpanded.add(documentId);
    }
    setExpandedVersions(newExpanded);
  };

  const handleDownload = (id: number) => {
    window.location.href = `/api/documents/${id}/download`;
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este documento?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const response = await fetch(`/api/documents/${id}`);
      if (!response.ok) throw new Error("Failed to fetch document");
      const document = await response.json();
      setDocumentToEdit(document);
      setIsEditModalOpen(true);
    } catch (error) {
      toast({
        title: "Erro ao carregar documento",
        description: error.message || "Falha ao carregar documento para edição.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateAIPrompt = async (id: number) => {
    try {
      const response = await fetch(`/api/documents/${id}/generate-prompt`);
      if (!response.ok) {
        throw new Error("Failed to generate AI prompt");
      }
      const data = await response.json();
      setGeneratedPrompt(data.prompt);
      toast({
        title: "Prompt de IA gerado",
        description: "O prompt de IA foi gerado com sucesso.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar prompt de IA",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = async () => {
    if (!selectedDocumentId) return;

    try {
      const response = await fetch(`/api/documents/${selectedDocumentId}/regenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correctionText }),
      });

      if (!response.ok) throw new Error("Failed to regenerate document");

      toast({
        title: "Documento regenerado",
        description: "O documento foi regenerado com sucesso.",
        variant: "default",
      });

      setIsCorrectionModalOpen(false);
      setCorrectionText("");
      refetch();
    } catch (error) {
      toast({
        title: "Erro ao regenerar",
        description: error instanceof Error ? error.message : "Falha ao regenerar documento.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="w-full h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Histórico de Documentos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Buscar documentos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(documentTypes).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <EditModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              document={documentToEdit}
            />

            {isLoading ? (
              <div className="text-center py-4">
                <Loader2 className="animate-spin h-4 w-4 inline-block mr-2" />
                <span>Carregando histórico...</span>
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((document) => (
                  <DocumentItem
                    key={document.id}
                    document={document}
                    isExpanded={expandedVersions.has(document.id)}
                    onToggleVersions={toggleVersions}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onGenerateAIPrompt={handleGenerateAIPrompt}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">Nenhum documento encontrado</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Display generated prompt below the history */}
      {generatedPrompt && (
        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt de IA Gerado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{generatedPrompt}</p>
                <Button
                  onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                  className="w-full"
                >
                  Copiar Prompt
                </Button>
                <Button
                  onClick={() => setGeneratedPrompt(null)}
                  variant="outline"
                  className="w-full"
                >
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

