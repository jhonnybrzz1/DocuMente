import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Edit2, Save, X } from "lucide-react";
import type { DocumentType } from "@shared/schema";

interface DocumentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedContent: string) => void;
  documentId: number | null;
  title: string;
  content: string;
  type: DocumentType | "";
}

export default function DocumentEditorModal({
  isOpen,
  onClose,
  onSave,
  documentId,
  title,
  content,
  type
}: DocumentEditorModalProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  // Reset content when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditedContent(content);
    }
  }, [isOpen, content]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedContent);
      onClose();
    } catch (error) {
      console.error("Failed to save document:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getDocumentTypeLabel = () => {
    const typeLabels: Record<string, string> = {
      prd: "PRD",
      epic: "Épico",
      userstories: "User Stories",
      roadmap: "Roadmap",
      releasenote: "Release Note",
      pitch: "Pitch",
      techspec: "Spec Técnica",
      testplan: "Plano de Testes",
      apidoc: "Doc de API"
    };
    return typeLabels[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit2 className="text-primary" size={20} />
            <span>Editar Documento: {title}</span>
            <span className="text-sm text-muted-foreground">
              ({getDocumentTypeLabel()})
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="document-content">Conteúdo do Documento</Label>
            <Textarea
              id="document-content"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Edite o conteúdo do documento aqui..."
            />
          </div>
          
          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="font-medium mb-2">Dicas de Edição:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Mantenha a estrutura original do documento</li>
              <li>Use Markdown para formatação básica</li>
              <li>Seções com emojis (📄, 📘, etc.) serão preservadas</li>
              <li>Listas com - serão convertidas para bullet points</li>
              <li>Títulos com # ou ## serão formatados corretamente</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            <X className="mr-2" size={16} />
            Cancelar
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isSaving || editedContent === content}
          >
            {isSaving ? (
              <>
                <span className="animate-pulse">Salvando...</span>
              </>
            ) : (
              <>
                <Save className="mr-2" size={16} />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}