import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, Wand2, Loader2 } from "lucide-react";
import type { DocumentType } from "@shared/schema";

interface GenerationControlsProps {
  demand: string;
  selectedType: DocumentType | "";
  title: string;
  onPreview: (content: string) => void;
}

export default function GenerationControls({ 
  demand, 
  selectedType, 
  title, 
  onPreview 
}: GenerationControlsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const previewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/preview-document", {
        type: selectedType,
        demand,
      });
      return response.json();
    },
    onSuccess: (data) => {
      onPreview(data.content);
    },
    onError: (error: any) => {
      toast({
        title: "Erro na prévia",
        description: error.message || "Falha ao gerar prévia do documento.",
        variant: "destructive",
      });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate-document", {
        type: selectedType,
        demand,
        title,
      });
      return response.json();
    },
    onSuccess: async (document) => {
      setIsProcessing(true);
      
      // Download the document
      try {
        const downloadResponse = await fetch(`/api/documents/${document.id}/download`);
        
        if (!downloadResponse.ok) {
          throw new Error(`HTTP ${downloadResponse.status}: ${downloadResponse.statusText}`);
        }
        
        const blob = await downloadResponse.blob();
        
        if (blob.size === 0) {
          throw new Error("Arquivo vazio recebido do servidor");
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${document.title}.docx`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Wait a bit before cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
        
        toast({
          title: "Documento gerado",
          description: "O documento foi gerado e baixado com sucesso.",
          variant: "default",
        });
        
        // Invalidate documents list to refresh history
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
        
      } catch (error: any) {
        console.error("Download error:", error);
        toast({
          title: "Erro no download",
          description: `O documento foi gerado mas falhou no download: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro na geração",
        description: error.message || "Falha ao gerar documento.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handlePreview = () => {
    if (!validateForm()) return;
    previewMutation.mutate();
  };

  const handleGenerate = () => {
    if (!validateForm()) return;
    generateMutation.mutate();
  };

  const validateForm = () => {
    if (!selectedType) {
      toast({
        title: "Tipo necessário",
        description: "Por favor, selecione um tipo de documento.",
        variant: "destructive",
      });
      return false;
    }

    if (!demand.trim()) {
      toast({
        title: "Demanda necessária",
        description: "Por favor, insira uma demanda ou documento.",
        variant: "destructive",
      });
      return false;
    }

    if (!title.trim()) {
      toast({
        title: "Título necessário",
        description: "Por favor, insira um título para o documento.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  if (isProcessing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Processando documento...
              </h3>
              <p className="text-sm text-gray-500">
                Aguarde enquanto criamos seu documento estruturado
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Gerar Documento</h3>
            <p className="text-sm text-gray-500 mt-1">
              Processe sua demanda e baixe o documento em formato Word
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={previewMutation.isPending}
              className="flex items-center justify-center"
            >
              {previewMutation.isPending ? (
                <Loader2 className="mr-2 animate-spin" size={16} />
              ) : (
                <Eye className="mr-2" size={16} />
              )}
              Visualizar Prévia
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="flex items-center justify-center"
            >
              {generateMutation.isPending ? (
                <Loader2 className="mr-2 animate-spin" size={16} />
              ) : (
                <Wand2 className="mr-2" size={16} />
              )}
              Gerar e Baixar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
