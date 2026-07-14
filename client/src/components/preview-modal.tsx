import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Save, Loader2, MessageSquare, ListChecks, Code2, Eye } from "lucide-react";
import type { DocumentType } from "@shared/schema";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import QualityScorePanel from "./quality-score-panel";
import RefineChat from "./refine-chat";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  demand: string;
  selectedType: DocumentType | "";
  title: string;
  tags?: string[];
}

export default function PreviewModal({
  isOpen,
  onClose,
  content,
  demand,
  selectedType,
  title,
  tags = [],
}: PreviewModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentContent, setCurrentContent] = useState(content);
  const [sideTab, setSideTab] = useState<"chat" | "score">("chat");
  const [editorMode, setEditorMode] = useState<"preview" | "source">("preview");

  // Sincroniza quando uma nova prévia é gerada
  useEffect(() => {
    setCurrentContent(content);
  }, [content, isOpen]);

  const generateFromPreviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/documents", {
        type: selectedType,
        title,
        content: currentContent,
        originalDemand: demand,
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
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na geração",
        description: error.message || "Falha ao gerar documento.",
        variant: "destructive",
      });
    },
  });

  // Renderiza markdown completo via marked + DOMPurify
  const renderedHtml = (() => {
    try {
      const html = marked.parse(currentContent || "", { breaks: true, gfm: true }) as string;
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          "p", "br", "h1", "h2", "h3", "h4", "h5", "h6",
          "strong", "em", "b", "i", "u", "code", "pre",
          "ul", "ol", "li", "blockquote", "hr",
          "table", "thead", "tbody", "tr", "th", "td",
          "a", "span", "div",
        ],
        ALLOWED_ATTR: ["class", "href", "target", "rel"],
      });
    } catch {
      return DOMPurify.sanitize(currentContent || "");
    }
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col p-0 sm:max-w-7xl">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>Prévia do Documento</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={20} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 overflow-hidden px-6 py-4 min-h-0">
          {/* Preview / Editor do conteúdo */}
          <div className="lg:col-span-3 flex flex-col min-h-0 border rounded-lg overflow-hidden">
            {/* Toggle preview ↔ markdown source */}
            <div className="flex items-center gap-1 px-3 py-2 border-b bg-muted/30 shrink-0">
              <Button
                variant={editorMode === "preview" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs gap-1.5"
                onClick={() => setEditorMode("preview")}
              >
                <Eye size={12} /> Preview
              </Button>
              <Button
                variant={editorMode === "source" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs gap-1.5"
                onClick={() => setEditorMode("source")}
              >
                <Code2 size={12} /> Markdown
              </Button>
            </div>

            {editorMode === "preview" ? (
              <div className="overflow-y-auto bg-muted/20 p-6 flex-1">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              </div>
            ) : (
              <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
                <ResizablePanel defaultSize={50} minSize={20}>
                  <Textarea
                    value={currentContent}
                    onChange={(e) => setCurrentContent(e.target.value)}
                    className="h-full w-full resize-none rounded-none border-0 font-mono text-xs bg-background focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
                    aria-label="Conteúdo markdown editável"
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={20}>
                  <div className="overflow-y-auto p-4 h-full bg-muted/20">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </div>

          {/* Side panel: Chat + Score em tabs */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <Tabs
              value={sideTab}
              onValueChange={(v) => setSideTab(v as "chat" | "score")}
              className="flex flex-col flex-1 min-h-0"
            >
              <TabsList className="grid grid-cols-2 mb-3 shrink-0">
                <TabsTrigger value="chat" className="gap-2">
                  <MessageSquare size={14} />
                  Refinar
                </TabsTrigger>
                <TabsTrigger value="score" className="gap-2">
                  <ListChecks size={14} />
                  Qualidade
                </TabsTrigger>
              </TabsList>
              <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
                <RefineChat
                  documentContent={currentContent}
                  documentType={selectedType}
                  onApplyUpdate={(newContent) => setCurrentContent(newContent)}
                />
              </TabsContent>
              <TabsContent value="score" className="flex-1 min-h-0 mt-0 overflow-y-auto">
                <QualityScorePanel
                  content={currentContent}
                  type={selectedType}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 pt-3 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button
            onClick={() => generateFromPreviewMutation.mutate()}
            disabled={generateFromPreviewMutation.isPending}
          >
            {generateFromPreviewMutation.isPending ? (
              <Loader2 className="mr-2 animate-spin" size={16} />
            ) : (
              <Save className="mr-2" size={16} />
            )}
            Gerar Documento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
