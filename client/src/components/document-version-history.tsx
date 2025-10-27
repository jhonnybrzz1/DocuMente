import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentVersionHistoryProps {
  documentId: number;
  onCreateNewVersion: (versionId: number) => void;
}

export default function DocumentVersionHistory({ documentId, onCreateNewVersion }: DocumentVersionHistoryProps) {
  const { toast } = useToast();
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["/api/documents", documentId, "versions"],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${documentId}/versions`);
      if (!response.ok) throw new Error("Failed to fetch document versions");
      return response.json();
    },
  });

  const toggleVersion = (versionId: number) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const handleDownload = (versionId: number) => {
    window.location.href = `/api/documents/versions/${versionId}/download`;
  };

  const handleCreateNewVersion = (versionId: number) => {
    onCreateNewVersion(versionId);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Histórico de Versões</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <Loader2 className="animate-spin h-4 w-4 inline-block mr-2" />
            <span>Carregando histórico de versões...</span>
          </div>
        ) : versions.length > 0 ? (
          <div className="space-y-4">
            {versions.map((version) => (
              <div key={version.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">Versão {version.version}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(version.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleDownload(version.id)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleCreateNewVersion(version.id)}
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                    >
                      Criar nova versão
                    </Button>
                    <Button
                      onClick={() => toggleVersion(version.id)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                    >
                      {expandedVersions.has(version.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {expandedVersions.has(version.id) && (
                  <div className="mt-2 border-t pt-2">
                    <h5 className="font-medium text-sm mb-1">Alterações:</h5>
                    <p className="text-xs whitespace-pre-wrap">{version.changes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">Nenhuma versão encontrada</p>
        )}
      </CardContent>
    </Card>
  );
}
