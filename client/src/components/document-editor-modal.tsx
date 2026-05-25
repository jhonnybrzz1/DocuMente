import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Edit2, Save, X, Undo2 } from "lucide-react";
import type { DocumentType } from "@shared/schema";
import AIQuickActions from "./ai-quick-actions";

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
  const [history, setHistory] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset content when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditedContent(content);
      setHistory([]);
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

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setEditedContent(previous);
  };

  const handleAIResult = (result: string, _action: string, replaceSelection: boolean) => {
    // Salva snapshot atual no histórico (pra desfazer)
    setHistory(h => [...h, editedContent]);

    if (replaceSelection && textareaRef.current) {
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newContent = editedContent.slice(0, start) + result + editedContent.slice(end);
      setEditedContent(newContent);
      // Restaura cursor após inserção
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start, start + result.length);
      });
    } else {
      setEditedContent(result);
    }
  };

  const getSelection = () => {
    const ta = textareaRef.current;
    if (!ta) return undefined;
    const { selectionStart, selectionEnd } = ta;
    if (selectionStart === selectionEnd) return undefined;
    return editedContent.slice(selectionStart, selectionEnd);
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
          <div className="flex items-center justify-between">
            <Label htmlFor="document-content">Conteúdo do Documento</Label>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  className="gap-2"
                  title="Desfazer última ação de IA"
                >
                  <Undo2 size={14} />
                  Desfazer ({history.length})
                </Button>
              )}
              {type && (
                <AIQuickActions
                  text={editedContent}
                  getSelection={getSelection}
                  onResult={handleAIResult}
                  context={`Documento do tipo ${getDocumentTypeLabel()}`}
                />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Textarea
              id="document-content"
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Edite o conteúdo do documento aqui..."
            />
          </div>
          
          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="font-medium mb-2">Dicas de Edição:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Selecione um trecho e use <strong>Ações IA</strong> pra aplicar só naquela parte</li>
              <li>Sem seleção, a ação roda no documento inteiro</li>
              <li>Use <strong>Desfazer</strong> pra reverter ações de IA indesejadas</li>
              <li>Mantenha a estrutura markdown original (#, ##, listas com -)</li>
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
