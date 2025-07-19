import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Search, Download, MoreVertical, History, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { documentTypes, type Document } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import VersionModal from "./version-modal";

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

interface DocumentItemProps {
  document: Document;
  isExpanded: boolean;
  onToggleVersions: () => void;
  onDownload: (document: Document, e: React.MouseEvent) => void;
}

function DocumentItem({ document, isExpanded, onToggleVersions, onDownload }: DocumentItemProps) {
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

  const hasMultipleVersions = document.version > 1;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Main Document */}
      <div className="p-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(document.type)}`}>
                {getTypeLabel(document.type)}
              </span>
              {document.version > 1 && (
                <Badge variant="secondary" className="text-xs">
                  v{document.version}
                </Badge>
              )}
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
          <div className="flex items-center space-x-1 ml-2">
            {hasMultipleVersions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVersions();
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <History size={12} className="ml-1" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsVersionModalOpen(true);
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
              title="Criar nova versão"
            >
              <Plus size={12} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => onDownload(document, e)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <Download size={12} />
            </Button>
          </div>
        </div>
      </div>

      {/* Versions List */}
      {hasMultipleVersions && (
        <Collapsible open={isExpanded}>
          <CollapsibleContent>
            <div className="border-t border-gray-100 bg-gray-50 p-2">
              {versionsLoading ? (
                <div className="text-xs text-gray-500 p-2">Carregando versões...</div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600 mb-2">
                    Histórico de Versões
                  </div>
                  {versions.slice(1).map((version: Document) => (
                    <div key={version.id} className="flex items-center justify-between p-2 hover:bg-white rounded text-xs">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            v{version.version}
                          </Badge>
                          <span className="text-gray-500">
                            {formatDistanceToNow(new Date(version.createdAt), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => onDownload(version, e)}
                        className="text-gray-400 hover:text-gray-600 p-1 h-auto"
                      >
                        <Download size={10} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      <VersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        document={document}
      />
    </div>
  );
}

export default function HistorySidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());
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

  const toggleVersions = (documentId: number) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(documentId)) {
      newExpanded.delete(documentId);
    } else {
      newExpanded.add(documentId);
    }
    setExpandedVersions(newExpanded);
  };

  const handleDownload = async (document: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      window.location.href = `/api/documents/${document.id}/download`;
      
      toast({
        title: "Download iniciado",
        description: "O documento está sendo baixado.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Erro no download",
        description: "Falha ao baixar o documento.",
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
              <DocumentItem 
                key={document.id} 
                document={document} 
                isExpanded={expandedVersions.has(document.id)}
                onToggleVersions={() => toggleVersions(document.id)}
                onDownload={handleDownload}
              />
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
