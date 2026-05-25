import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Download, Loader2, MessageSquare, ListChecks } from "lucide-react";
import type { DocumentType } from "@shared/schema";
import DOMPurify from "dompurify";
import { marked } from "marked";
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
  const [currentContent, setCurrentContent] = useState(content);
  const [sideTab, setSideTab] = useState<"chat" | "score">("chat");

  // Sincroniza quando uma nova prévia é gerada
  useEffect(() => {
    setCurrentContent(content);
  }, [content, isOpen]);

  const generateFromPreviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate-document", {
        type: selectedType,
        demand,
        title,
        tags,
      });
      return response.json();
    },
    onSuccess: async (doc) => {
      try {
        const downloadResponse = await fetch(`/api/documents/${doc.id}/download`);
        const blob = await downloadResponse.blob();

        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement("a");
        a.href = url;
        a.download = `${doc.title}.docx`;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Documento gerado",
          description: "O documento foi gerado e baixado com sucesso.",
          variant: "default",
        });

        onClose();
      } catch (error) {
        toast({
          title: "Erro no download",
          description: "O documento foi gerado mas falhou no download.",
          variant: "destructive",
        });
      }
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
          {/* Preview do conteúdo */}
          <div className="lg:col-span-3 overflow-y-auto border rounded-lg bg-muted/20 p-6 min-h-0">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
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
              <Download className="mr-2" size={16} />
            )}
            Gerar e Baixar Word
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
