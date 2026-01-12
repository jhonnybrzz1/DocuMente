import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, Wand2, Loader2, Paperclip, X } from "lucide-react";
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedText, setExtractedText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        extractedText,
      });
      return response.json();
    },
    onSuccess: async (document) => {
      setIsProcessing(true);

      // Download the document
      try {
        const downloadResponse = await fetch(`/api/documents/${document.id}/download`);

        if (!downloadResponse.ok) {
          const errorData = await downloadResponse.json().catch(() => ({ message: 'Erro desconhecido' }));
          throw new Error(errorData.message || `Erro ${downloadResponse.status}`);
        }

        const blob = await downloadResponse.blob();

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
          title: "Documento gerado",
          description: "O documento foi gerado e baixado com sucesso.",
          variant: "default",
        });

        // Invalidate documents list to refresh history
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });

      } catch (error) {
        console.error("Download error:", error);
        toast({
          title: "Erro no download",
          description: error instanceof Error ? error.message : "O documento foi gerado mas falhou no download.",
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

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => {
      const allowedTypes = [
        "application/pdf", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.ms-powerpoint"
      ];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: `O arquivo ${file.name} não é suportado.`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 15 * 1024 * 1024) { // 15MB
        toast({
          title: "Arquivo muito grande",
          description: `O arquivo ${file.name} excede o limite de 15MB.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    const updatedFiles = [...uploadedFiles, ...validFiles];
    setUploadedFiles(updatedFiles);
    uploadFiles(updatedFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    if (updatedFiles.length > 0) {
      uploadFiles(updatedFiles);
    } else {
      setExtractedText("");
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Falha no upload dos arquivos.");
      }

      const data = await response.json();
      setExtractedText(data.extractedText);
      toast({
        title: "Arquivos processados",
        description: "O conteúdo dos arquivos foi extraído com sucesso.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar os arquivos.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

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

  const isLoading = generateMutation.isPending;

  if (isLoading) {
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
        {/* Botão de anexo de documentos - posicionar logo abaixo da área de texto */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <Loader2 className="mr-2 animate-spin" size={16} />
            ) : (
              <Paperclip className="mr-2" size={16} />
            )}
            Anexar Documentos
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files)}
            accept=".pdf,.docx,.txt,.xlsx,.xls,.pptx,.ppt,.csv"
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700">Arquivos Anexados:</h4>
            <ul className="mt-2 space-y-2">
              {uploadedFiles.map((file, index) => (
                <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                  <span className="text-sm text-gray-800">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Botões de ação organizados horizontalmente */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={previewMutation.isPending}
            className="flex-1 flex items-center justify-center"
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
            className="flex-1 flex items-center justify-center"
          >
            {generateMutation.isPending ? (
              <Loader2 className="mr-2 animate-spin" size={16} />
            ) : (
              <Wand2 className="mr-2" size={16} />
            )}
            Gerar e Baixar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
