
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { type Document } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

export default function EditModal({ isOpen, onClose, document }: EditModalProps) {
  const [editedContent, setEditedContent] = useState(document?.content || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset content when document changes
  useEffect(() => {
    if (document) {
      setEditedContent(document.content);
    }
  }, [document]);

  const saveEditMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/documents/${document?.id}/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar edição");
      }

      return response.json();
    },
    onSuccess: (newVersion) => {
      toast({
        title: "Documento editado",
        description: `Versão ${newVersion.version} do documento "${document?.title}" foi criada com sucesso.`,
      });

      // Invalidate queries to refresh the document list and versions
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", document?.id, "versions"] });

      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar edição",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedContent.trim()) {
      toast({
        title: "Conteúdo vazio",
        description: "O conteúdo do documento não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }
    saveEditMutation.mutate(editedContent);
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Documento</DialogTitle>
          <DialogDescription>
            Edite o conteúdo de "{document.title}" diretamente. As alterações serão salvas como uma nova versão.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-content">Conteúdo do Documento:</Label>
            <Textarea
              id="document-content"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[300px] max-h-[500px] font-mono text-sm"
              maxLength={10000}
            />
            <div className="text-xs text-gray-500 text-right">
              {editedContent.length}/10000 caracteres
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saveEditMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saveEditMutation.isPending || !editedContent.trim()}
            >
              {saveEditMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar como Nova Versão
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
