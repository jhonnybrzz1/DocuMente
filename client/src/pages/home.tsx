import { useState, useEffect } from "react";
import AppHeader from "@/components/app-header";
import ApiKeyConfig from "@/components/api-key-config";
import EnhancedDocumentInput from "@/components/enhanced-document-input";
import DocumentTypeSelector from "@/components/document-type-selector";
import GenerationControls from "@/components/generation-controls";
import HistorySidebar from "@/components/history-sidebar";
import PreviewModal from "@/components/preview-modal";
import TemplateSelector, { type Template } from "@/components/template-selector";
import type { DocumentType } from "@shared/schema";
import { documentTypes } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Play, Clock, CheckCircle2, AlertCircle, Loader2, ListOrdered, Paperclip, Edit, FileEdit } from "lucide-react";

export interface QueueItem {
  id: string;
  title: string;
  demand: string;
  type: DocumentType;
  tags: string[];
  status: "idle" | "pending" | "success" | "error";
  error?: string;
  documentId?: number;
  hasAttachments?: boolean;
  extractedText?: string;
}

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [demand, setDemand] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<DocumentType[]>([]);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // Estados de Anexos Elevados para controle da Fila
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedText, setExtractedText] = useState("");

  // Estados da Fila
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Carrega demanda do AiChatFlow enviada via Query Parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const demandParam = searchParams.get("demand");
    const titleParam = searchParams.get("title") || "Demanda Externa";
    const typeParam = searchParams.get("type") as DocumentType | null;
    const tagsParam = searchParams.get("tags");

    if (demandParam) {
      const type = typeParam && documentTypes.some(dt => dt.value === typeParam)
        ? typeParam
        : "prd"; // Fallback padrão

      const parsedTags = tagsParam 
        ? tagsParam.split(",").map(t => t.trim()).filter(Boolean)
        : [];

      const newItem: QueueItem = {
        id: Math.random().toString(36).substring(7),
        title: titleParam,
        demand: demandParam,
        type: type,
        tags: parsedTags,
        status: "idle",
      };

      setQueue((prevQueue) => {
        // Evita inserções duplicadas da mesma demanda ao carregar
        if (prevQueue.some(item => item.demand === demandParam && item.type === type)) {
          return prevQueue;
        }
        return [...prevQueue, newItem];
      });

      toast({
        title: "Demanda do AiChatFlow Importada",
        description: `A demanda "${titleParam}" foi colocada na fila de refinamento/geração.`,
      });

      // Limpa os parâmetros de busca da URL para evitar reinserção ao atualizar a página
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [toast]);

  const handleUseTemplate = () => {
    setShowTemplateSelector(true);
  };

  const handleSelectTemplate = (template: Template) => {
    setDemand(template.content);
    setShowTemplateSelector(false);
  };

  // Adiciona a demanda atual à fila (criando múltiplos itens se múltiplos tipos estiverem selecionados)
  const handleAddToQueue = () => {
    if (!title.trim()) {
      toast({
        title: "Título necessário",
        description: "Dê um título ao documento antes de adicioná-lo à fila.",
        variant: "destructive",
      });
      return;
    }
    if (selectedTypes.length === 0) {
      toast({
        title: "Tipo necessário",
        description: "Selecione pelo menos um tipo de documento antes de enfileirar.",
        variant: "destructive",
      });
      return;
    }
    if (demand.trim().length < 10) {
      toast({
        title: "Demanda muito curta",
        description: "A demanda do produto deve ter pelo menos 10 caracteres.",
        variant: "destructive",
      });
      return;
    }

    const newItems: QueueItem[] = selectedTypes.map((type) => {
      const suffix = selectedTypes.length > 1 ? ` - ${getDocTypeLabel(type)}` : "";
      return {
        id: Math.random().toString(36).substring(7),
        title: `${title.trim()}${suffix}`,
        demand: demand.trim(),
        type: type,
        tags: [...tags],
        status: "idle",
        hasAttachments: uploadedFiles.length > 0,
        extractedText: extractedText,
      };
    });

    setQueue([...queue, ...newItems]);
    
    // Limpa a tela ativa para digitar a próxima demanda (incluindo anexos e seleções)
    setTitle("");
    setDemand("");
    setTags([]);
    setUploadedFiles([]);
    setExtractedText("");
    setSelectedTypes([]);
    
    toast({
      title: "Adicionado(s) à fila",
      description: `${newItems.length} documento(s) enfileirados para geração sequencial.`,
    });
  };

  const handleRemoveFromQueue = (id: string) => {
    setQueue(queue.filter((item) => item.id !== id));
  };

  const handleEditQueueItem = (item: QueueItem) => {
    setTitle(item.title);
    setDemand(item.demand);
    setSelectedTypes([item.type]);
    setTags(item.tags);
    if (item.extractedText) {
      setExtractedText(item.extractedText);
    }
    setQueue(queue.filter((q) => q.id !== item.id));
    toast({
      title: "Demanda carregada no editor",
      description: "Ajuste os detalhes e adicione de volta à fila ou gere o documento.",
    });
  };

  const handleClearQueue = () => {
    setQueue([]);
  };

  // Execução serial/fila de todos os itens pendentes ou em erro
  const handleProcessQueue = async (targetQueue?: QueueItem[]) => {
    const queueToProcess = targetQueue || queue;
    if (queueToProcess.length === 0 || isProcessingQueue) return;
    setIsProcessingQueue(true);

    const updatedQueue = [...queueToProcess];

    for (let i = 0; i < updatedQueue.length; i++) {
      const item = updatedQueue[i];
      if (item.status === "success") continue;

      updatedQueue[i] = { ...item, status: "pending" };
      setQueue([...updatedQueue]);

      try {
        const response = await fetch("/api/generate-document", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: item.type,
            demand: item.demand,
            title: item.title,
            tags: item.tags,
            extractedText: item.extractedText,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ message: "Erro no servidor" }));
          throw new Error(errData.message || `Erro ${response.status}`);
        }

        const data = await response.json() as { id: number };

        updatedQueue[i] = { ...item, status: "success", documentId: data.id };
        setQueue([...updatedQueue]);

        toast({
          title: `Sucesso: ${item.title}`,
          description: "Documento gerado na fila.",
        });

        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      } catch (error: any) {
        console.error(error);
        updatedQueue[i] = { 
          ...item, 
          status: "error", 
          error: error.message || "Erro na geração." 
        };
        setQueue([...updatedQueue]);

        toast({
          title: `Erro na fila: ${item.title}`,
          description: error.message || "Falha na chamada de IA.",
          variant: "destructive",
        });
      }

      // Intervalo de 3 segundos entre chamadas para contornar o rate limit de 10 requisições/min
      if (i < updatedQueue.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    setIsProcessingQueue(false);
  };

  // Dispara a geração em lote/fila diretamente da tela ativa
  const handleGenerateBatch = () => {
    if (!title.trim()) {
      toast({
        title: "Título necessário",
        description: "Dê um título ao documento antes de gerá-lo.",
        variant: "destructive",
      });
      return;
    }
    if (selectedTypes.length === 0) {
      toast({
        title: "Tipo necessário",
        description: "Selecione pelo menos um tipo de documento.",
        variant: "destructive",
      });
      return;
    }
    if (demand.trim().length < 10) {
      toast({
        title: "Demanda muito curta",
        description: "A demanda do produto deve ter pelo menos 10 caracteres.",
        variant: "destructive",
      });
      return;
    }

    const newItems: QueueItem[] = selectedTypes.map((type) => {
      const suffix = selectedTypes.length > 1 ? ` - ${getDocTypeLabel(type)}` : "";
      return {
        id: Math.random().toString(36).substring(7),
        title: `${title.trim()}${suffix}`,
        demand: demand.trim(),
        type: type,
        tags: [...tags],
        status: "idle",
        hasAttachments: uploadedFiles.length > 0,
        extractedText: extractedText,
      };
    });

    const newQueue = [...queue, ...newItems];
    setQueue(newQueue);

    // Limpa a tela ativa
    setTitle("");
    setDemand("");
    setTags([]);
    setUploadedFiles([]);
    setExtractedText("");
    setSelectedTypes([]);

    toast({
      title: "Geração em lote iniciada",
      description: `${newItems.length} documento(s) adicionados à fila e sendo gerados sequencialmente.`,
    });

    // Inicia processamento
    handleProcessQueue(newQueue);
  };

  const getDocTypeLabel = (type: DocumentType) => {
    return documentTypes.find((dt) => dt.value === type)?.label || type;
  };

  const handleChainDocument = (result: {
    demand: string;
    suggestedTitle: string;
    targetType: string;
    parentDocumentId: number;
  }) => {
    setDemand(result.demand);
    setTitle(result.suggestedTitle);
    setSelectedTypes([result.targetType as DocumentType]);
    setTags([]);
    // scroll suave ao topo para o editor ficar visível
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast({
      title: "Editor pré-populado",
      description: `Demanda para "${result.suggestedTitle}" carregada. Revise e gere o documento.`,
    });
  };

  const activeType = selectedTypes[selectedTypes.length - 1] || "";

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <ApiKeyConfig />
            
            <EnhancedDocumentInput 
              demand={demand}
              setDemand={setDemand}
              title={title}
              setTitle={setTitle}
              onUseTemplate={handleUseTemplate}
              selectedType={activeType}
              setSelectedType={(type) => setSelectedTypes(type ? [type] : [])}
              tags={tags}
              setTags={setTags}
            />
            
            <DocumentTypeSelector 
              selectedTypes={selectedTypes}
              onTypesChange={setSelectedTypes}
            />
            
            <GenerationControls 
              demand={demand}
              selectedTypes={selectedTypes}
              title={title}
              tags={tags}
              onPreview={(content) => {
                setPreviewContent(content);
                setShowPreview(true);
              }}
              onAddToQueue={handleAddToQueue}
              onGenerateBatch={handleGenerateBatch}
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
              extractedText={extractedText}
              setExtractedText={setExtractedText}
            />

            {/* Painel da Fila de Documentos */}
            {(queue.length > 0) && (
              <Card className="border border-border bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="flex items-center text-md font-semibold text-foreground">
                      <ListOrdered className="text-primary mr-2" size={18} />
                      Fila de Geração Sequencial
                      <Badge className="ml-2 bg-primary/20 text-primary border border-primary/30">
                        {queue.filter(q => q.status !== "success").length} pendentes
                      </Badge>
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearQueue}
                        disabled={isProcessingQueue}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Limpar Fila
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleProcessQueue()}
                        disabled={isProcessingQueue || queue.every(q => q.status === "success")}
                        className="text-xs font-semibold"
                      >
                        {isProcessingQueue ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Play className="mr-1.5 h-3.5 w-3.5" />
                            Gerar Todos da Fila
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 px-4 pb-4 space-y-2">
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                    {queue.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-md border text-sm transition-all ${
                          item.status === "pending"
                            ? "bg-primary/5 border-primary/30 animate-pulse"
                            : item.status === "success"
                            ? "bg-green-500/5 border-green-500/25"
                            : item.status === "error"
                            ? "bg-destructive/5 border-destructive/25"
                            : "bg-muted/40 border-border"
                        }`}
                      >
                        <div className="flex flex-col gap-1.5 max-w-[70%]">
                          <span className="font-medium text-foreground line-clamp-1">
                            {item.title}
                          </span>
                          <div className="flex gap-2 items-center flex-wrap">
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5 bg-background">
                              {getDocTypeLabel(item.type)}
                            </Badge>
                            {item.hasAttachments && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5 bg-blue-500/10 border-blue-500/30 text-blue-600 gap-1 font-medium">
                                <Paperclip size={10} />
                                Anexo
                              </Badge>
                            )}
                            {item.tags.map((t, idx) => (
                              <span key={idx} className="text-[10px] text-muted-foreground">
                                #{t}
                              </span>
                            ))}
                          </div>
                          {item.error && (
                            <span className="text-xs text-destructive font-medium mt-0.5 line-clamp-1">
                              Erro: {item.error}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Badges de Status do Item */}
                          {item.status === "idle" && (
                            <Badge variant="secondary" className="gap-1 text-[11px] h-6">
                              <Clock size={11} />
                              Aguardando
                            </Badge>
                          )}
                          {item.status === "pending" && (
                            <Badge variant="outline" className="gap-1 text-[11px] h-6 border-primary/50 text-primary">
                              <Loader2 size={11} className="animate-spin" />
                              Gerando...
                            </Badge>
                          )}
                          {item.status === "success" && (
                            <Badge className="gap-1 text-[11px] h-6 bg-green-500 hover:bg-green-600 border-none text-white">
                              <CheckCircle2 size={11} />
                              Concluído
                            </Badge>
                          )}
                          {item.status === "error" && (
                            <Badge variant="destructive" className="gap-1 text-[11px] h-6">
                              <AlertCircle size={11} />
                              Falhou
                            </Badge>
                          )}

                          {/* Botão de Editar/Refinar */}
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isProcessingQueue || item.status === "success" || item.status === "pending"}
                            onClick={() => handleEditQueueItem(item)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full hover:bg-primary/10"
                            title="Editar e Refinar Demanda"
                          >
                            <Edit size={14} />
                          </Button>

                          {/* Botão de Remover da Fila */}
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isProcessingQueue || item.status === "success"}
                            onClick={() => handleRemoveFromQueue(item.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10"
                            title="Remover da fila"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <HistorySidebar onChainDocument={handleChainDocument} />
          </div>
        </div>
      </main>

      <PreviewModal 
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        content={previewContent}
        demand={demand}
        selectedType={activeType}
        title={title}
        tags={tags}
      />

      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={handleSelectTemplate}
        documentType={activeType}
      />
    </div>
  );
}
