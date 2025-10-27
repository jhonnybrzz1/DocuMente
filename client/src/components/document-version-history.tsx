import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EditDocumentDialog } from "./EditDocumentDialog";

interface DocumentVersionHistoryProps {
  documentId: number;
  onCreateNewVersion: (versionId: number) => void;
}

export function DocumentVersionHistory({
  documentId,
  onCreateNewVersion,
}: DocumentVersionHistoryProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentVersionId, setCurrentVersionId] = useState<number | null>(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${documentId}/versions`);
      if (!response.ok) throw new Error('Failed to fetch document versions');
      return response.json();
    },
  });

  const toast = useToast();

  const handleSaveNewVersion = async (additionalContent: string) => {
    try {
      // Validate additional content
      if (!additionalContent.trim()) {
        toast({
          title: 'Erro',
          description: 'Por favor, forneça informações adicionais para gerar uma nova versão.',
          variant: 'destructive',
        });
        return;
      }

      // Get the original document content
      const originalVersion = versions.find(v => v.id === currentVersionId);
      if (!originalVersion) throw new Error('Original version not found');

      // Combine original content with additional content
      const combinedContent = `${originalVersion.content}\n\n${additionalContent}`;

      // Set generating state
      setIsGenerating(true);

      // Show loading state
      toast({
        title: 'Gerando nova versão',
        description: 'Por favor, aguarde enquanto a IA gera a nova versão do documento.',
      });

      // Call the AI to generate a new version with the combined content
      const response = await fetch(`/api/generate-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: originalVersion.type,
          demand: combinedContent,
          title: `Versão ${originalVersion.version + 1} - ${originalVersion.title} (Atualizada)`
        }),
      });

      if (!response.ok) throw new Error('Failed to generate new version');

      const newVersion = await response.json();

      toast({
        title: 'Nova versão gerada',
        description: 'A nova versão do documento foi gerada com sucesso.',
      });

      setIsEditDialogOpen(false);
      onCreateNewVersion(newVersion.id);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao gerar nova versão do documento.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateNewVersion = (versionId: number) => {
    setCurrentVersionId(versionId);
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Histórico de Versões</CardTitle>
        </CardHeader>
        <CardContent>
          {versions?.map((version) => (
            <div key={version.id} className="mb-4 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{version.title}</h3>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleCreateNewVersion(version.id)}
                    variant="outline"
                  >
                    Criar nova versão
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Versão {version.version} - {new Date(version.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          <EditDocumentDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            documentId={documentId}
            versionId={currentVersionId!}
            initialContent={versions?.find(v => v.id === currentVersionId)?.content || ''}
            onSave={handleSaveNewVersion}
            isGenerating={isGenerating}
          />
        </CardContent>
      </Card>
    </div>
  );
}