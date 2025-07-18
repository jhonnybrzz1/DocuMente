import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Download, Loader2 } from "lucide-react";
import type { DocumentType } from "@shared/schema";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  demand: string;
  selectedType: DocumentType | "";
  title: string;
}

export default function PreviewModal({ 
  isOpen, 
  onClose, 
  content, 
  demand, 
  selectedType, 
  title 
}: PreviewModalProps) {
  const { toast } = useToast();

  const generateFromPreviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate-document", {
        type: selectedType,
        demand,
        title,
      });
      return response.json();
    },
    onSuccess: async (document) => {
      try {
        window.location.href = `/api/documents/${document.id}/download`;
        
        toast({
          title: "Documento gerado",
          description: "O documento foi gerado e está sendo baixado.",
          variant: "default",
        });
        
        onClose();
        
      } catch (error: any) {
        console.error("Download error:", error);
        toast({
          title: "Erro no download",
          description: "Falha no download do documento.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro na geração",
        description: error.message || "Falha ao gerar documento.",
        variant: "destructive",
      });
    },
  });

  const formatContentForDisplay = (content: string) => {
    // Convert markdown-like formatting to HTML for better display
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 text-gray-900">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 text-gray-800">$2</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2 text-gray-700">$3</h3>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Prévia do Documento</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)] p-6 border rounded-lg bg-gray-50">
          <div 
            className="prose max-w-none text-gray-900"
            dangerouslySetInnerHTML={{ 
              __html: `<p class="mb-4">${formatContentForDisplay(content)}</p>` 
            }}
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button
            onClick={() => generateFromPreviewMutation.mutate()}
            disabled={generateFromPreviewMutation.isPending}
            className="flex items-center"
          >
            {generateFromPreviewMutation.isPending ? (
              <Loader2 className="mr-2 animate-spin" size={16} />
            ) : (
              <Download className="mr-2" size={16} />
            )}
            Gerar Word
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
