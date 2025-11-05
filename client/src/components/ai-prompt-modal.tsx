import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Sparkles } from "lucide-react";
import type { Document } from "@shared/schema";

interface AiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

export default function AiPromptModal({ isOpen, onClose, document }: AiPromptModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && document) {
      fetchPrompt();
    }
  }, [isOpen, document]);

  const fetchPrompt = async () => {
    if (!document) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${document.id}/generate-prompt`);

      if (!response.ok) {
        throw new Error("Falha ao gerar prompt");
      }

      const data = await response.json();
      setPrompt(data.prompt);
    } catch (error) {
      console.error("Error fetching prompt:", error);
      toast({
        title: "Erro ao gerar prompt",
        description: "Não foi possível gerar o prompt para IA.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setIsCopied(true);
      toast({
        title: "Prompt copiado!",
        description: "O prompt foi copiado para a área de transferência.",
        variant: "default",
      });

      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o prompt.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setPrompt("");
    setIsCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <DialogTitle>Gerar Prompt para IA</DialogTitle>
          </div>
          <DialogDescription>
            Prompt otimizado gerado automaticamente a partir do documento "{document?.title}".
            Você pode editar o texto antes de copiar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Gerando prompt..."
            />
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          <Button
            onClick={handleCopy}
            disabled={isLoading || !prompt}
            className="flex items-center space-x-2"
          >
            {isCopied ? (
              <>
                <Check size={16} />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copiar Prompt</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
