import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, Wand2, Loader2, Paperclip, X, Plus } from "lucide-react";
import type { DocumentType } from "@shared/schema";

interface GenerationControlsProps {
  demand: string;
  selectedTypes: DocumentType[];
  title: string;
  tags?: string[];
  onPreview: (content: string) => void;
  onAddToQueue?: () => void;
  onGenerateBatch?: () => void;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  extractedText: string;
  setExtractedText: React.Dispatch<React.SetStateAction<string>>;
}

export default function GenerationControls({
  demand,
  selectedTypes,
  title,
  tags = [],
  onPreview,
  onAddToQueue,
  onGenerateBatch,
  uploadedFiles,
  setUploadedFiles,
  extractedText,
  setExtractedText
}: GenerationControlsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const previewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/preview-document", {
        type: selectedTypes[selectedTypes.length - 1] || "",
        demand,
      });
      return response.json();
    },
    onSuccess: (data) => {
      onPreview(data.content);
    },
    onError: (error: Error) => {
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
        type: selectedTypes[0] || "",
        demand,
        title,
        extractedText,
        tags,
      });
      return response.json();
    },
    onSuccess: async () => {
      toast({
        title: "Documento gerado",
        description: "O documento foi salvo no histórico. Use o menu de exportação para baixar.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setUploadedFiles([]);
      setExtractedText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na geração",
        description: error.message || "Falha ao gerar documento.",
        variant: "destructive",
      });
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
        "application/vnd.ms-powerpoint",
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/webm",
        "audio/ogg",
        "audio/x-m4a",
        "audio/m4a",
        "audio/mp4"
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
    
    if (selectedTypes.length > 1 && onGenerateBatch) {
      onGenerateBatch();
    } else {
      generateMutation.mutate();
    }
  };

  const validateForm = () => {
    if (selectedTypes.length === 0) {
      toast({
        title: "Tipo necessário",
        description: "Por favor, selecione pelo menos um tipo de documento.",
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
          <div className="flex items-center space-x-4" role="status" aria-live="polite">
            <Loader2 className="animate-spin h-8 w-8 text-primary" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Processando documento...
              </h3>
              <p className="text-sm text-muted-foreground">
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
            accept=".pdf,.docx,.txt,.xlsx,.xls,.pptx,.ppt,.csv,.mp3,.wav,.webm,.ogg,.m4a,.mp4"
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-foreground">Arquivos Anexados:</h4>
            <ul className="mt-2 space-y-2" role="list">
              {uploadedFiles.map((file, index) => (
                <li key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                  <span className="text-sm text-foreground">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="h-9 w-9"
                    aria-label={`Remover arquivo ${file.name}`}
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
            className="flex-1 flex items-center justify-center h-10 text-sm"
          >
            {previewMutation.isPending ? (
              <Loader2 className="mr-2 animate-spin" size={16} />
            ) : (
              <Eye className="mr-2" size={16} />
            )}
            Visualizar Prévia
          </Button>

          {onAddToQueue && (
            <Button
              type="button"
              variant="secondary"
              onClick={onAddToQueue}
              className="flex-1 flex items-center justify-center h-10 text-sm"
            >
              <Plus className="mr-2" size={16} />
              + Adicionar à Fila
            </Button>
          )}

          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="flex-1 flex items-center justify-center h-10 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {generateMutation.isPending ? (
              <Loader2 className="mr-2 animate-spin" size={16} />
            ) : (
              <Wand2 className="mr-2" size={16} />
            )}
            Gerar Documento
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
