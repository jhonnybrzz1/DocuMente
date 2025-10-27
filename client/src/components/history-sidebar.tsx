

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, ChevronDown, ChevronUp, Loader2, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { documentTypes } from "@shared/schema";
import PromptGeneratorButton from "./prompt-generator-button";
import PromptCreator from "./prompt-creator";
import DocumentVersionHistory from "./document-version-history";

interface DocumentItemProps {
  document: {
    id: number;
    title: string;
    type: string;
    createdAt: string;
    content: string;
  };
  isExpanded: boolean;
  onToggleVersions: (id: number) => void;
  onDownload: (id: number) => void;
  onDelete: (id: number) => void;
  onGeneratePrompt: (id: number) => void;
}

function DocumentItem({ document, isExpanded, onToggleVersions, onDownload, onDelete, onGeneratePrompt, onCreatePrompt }: DocumentItemProps) {
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

  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/documents", searchQuery, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filterType && filterType !== "all") params.append("type", filterType);

      const response = await fetch(`/api/documents?${params}`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      return data.map((doc: any) => ({
        ...doc,
        content: doc.content || ""
      }));
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

  const [showPromptGenerator, setShowPromptGenerator] = useState<Set<number>>(new Set());
  const [showPromptCreator, setShowPromptCreator] = useState<Set<number>>(new Set());
  const [showVersionHistory, setShowVersionHistory] = useState<Set<number>>(new Set());

  const togglePromptGenerator = (documentId: number) => {
    const newShowPromptGenerator = new Set(showPromptGenerator);
    if (newShowPromptGenerator.has(documentId)) {
      newShowPromptGenerator.delete(documentId);
    } else {
      newShowPromptGenerator.add(documentId);
      // Close prompt creator if open
      setShowPromptCreator(new Set());
    }
    setShowPromptGenerator(newShowPromptGenerator);
  };

  const togglePromptCreator = (documentId: number) => {
    const newShowPromptCreator = new Set(showPromptCreator);
    if (newShowPromptCreator.has(documentId)) {
      newShowPromptCreator.delete(documentId);
    } else {
      newShowPromptCreator.add(documentId);
      // Close version history if open
      setShowVersionHistory(new Set());
    }
    setShowPromptCreator(newShowPromptCreator);
  };

  const toggleVersionHistory = (documentId: number) => {
    const newShowVersionHistory = new Set(showVersionHistory);
    if (newShowVersionHistory.has(documentId)) {
      newShowVersionHistory.delete(documentId);
    } else {
      newShowVersionHistory.add(documentId);
      // Close prompt creator if open
      setShowPromptCreator(new Set());
    }
    setShowVersionHistory(newShowVersionHistory);
  };
    const newShowPromptCreator = new Set(showPromptCreator);
    if (newShowPromptCreator.has(documentId)) {
      newShowPromptCreator.delete(documentId);
    } else {
      newShowPromptCreator.add(documentId);
      // Close prompt generator if open
      setShowPromptGenerator(new Set());
    }
    setShowPromptCreator(newShowPromptCreator);
  };
    const newShowPromptGenerator = new Set(showPromptGenerator);
    if (newShowPromptGenerator.has(documentId)) {
      newShowPromptGenerator.delete(documentId);
    } else {
      newShowPromptGenerator.add(documentId);
    }
    setShowPromptGenerator(newShowPromptGenerator);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este documento?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleGeneratePrompt = (id: number) => {
    togglePromptGenerator(id);
  };

  const handleCreatePrompt = (id: number) => {
    togglePromptCreator(id);
  };

  const handleShowVersionHistory = (id: number) => {
    toggleVersionHistory(id);
  };
    togglePromptCreator(id);
  };
    togglePromptGenerator(id);
  };

  return (
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
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">Nenhum documento encontrado</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

