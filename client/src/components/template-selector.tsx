import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Input } from "./input";
import { Plus, Save, X, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DocumentType } from "@shared/schema";

interface Template {
  id: string;
  name: string;
  type: DocumentType;
  content: string;
  isCustom: boolean;
}

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
  documentType: DocumentType | "";
}

export default function TemplateSelector({
  isOpen,
  onClose,
  onSelect,
  documentType,
}: TemplateSelectorProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>(getDefaultTemplates());
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    type: documentType as DocumentType,
    content: "",
  });

  function getDefaultTemplates(): Template[] {
    return [
      {
        id: "prd-standard",
        name: "PRD Padrão",
        type: "prd",
        content: "📄 **PRD (Product Requirements Document)**\n\n## Visão Geral do Produto\n\n## Cenário Atual (Problema)\n\n## Solução Proposta\n\n## Requisitos Funcionais\n\n## Casos de Uso\n\n## Fluxo de Funcionamento\n\n## Validações\n\n## Dependências\n\n## Resultados Esperados\n\n## Métricas de Sucesso",
        isCustom: false,
      },
      {
        id: "userstories-standard",
        name: "User Stories Padrão",
        type: "userstories",
        content: "🧩 **User Stories**\n\nComo [tipo de usuário], eu quero [ação], para [benefício].\n\n**Critérios de Aceite:**\n- [Critério 1]\n- [Critério 2]\n- [Critério 3]",
        isCustom: false,
      },
      {
        id: "techspec-standard",
        name: "Especificação Técnica Padrão",
        type: "techspec",
        content: "⚙️ **Especificação Técnica**\n\n## Visão Geral Técnica\n\n## Arquitetura Proposta\n\n## Tecnologias Utilizadas\n\n## Requisitos Técnicos\n\n## Interfaces e APIs\n\n## Considerações de Performance\n\n## Segurança\n\n## Testes Técnicos\n\n## Deployment e Infraestrutura",
        isCustom: false,
      },
    ];
  }

  const filteredTemplates = templates.filter(
    (template) => template.type === documentType || documentType === ""
  );

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsEditing(false);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      onClose();
    }
  };

  const handleSaveTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast({
        title: "Erro",
        description: "Nome e conteúdo são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const newId = `custom-${Date.now()}`;
    const templateToAdd = {
      ...newTemplate,
      id: newId,
      isCustom: true,
    };

    setTemplates([...templates, templateToAdd]);
    setSelectedTemplate(templateToAdd);
    setIsEditing(false);

    toast({
      title: "Template salvo",
      description: "Seu template personalizado foi salvo com sucesso.",
      variant: "default",
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter((t) => t.id !== templateId));
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null);
    }

    toast({
      title: "Template excluído",
      description: "O template foi removido com sucesso.",
      variant: "default",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Selecionar Template</span>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Plus className="mr-2" size={16} />
                Novo Template
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome do Template</Label>
              <Input
                id="template-name"
                value={newTemplate.name}
                onChange={(e) => 
                  setNewTemplate({ ...newTemplate, name: e.target.value })
                }
                placeholder="Ex: Meu Template de PRD"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-type">Tipo de Documento</Label>
              <Select
                value={newTemplate.type}
                onValueChange={(value) => 
                  setNewTemplate({ ...newTemplate, type: value as DocumentType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prd">PRD</SelectItem>
                  <SelectItem value="epic">Épico</SelectItem>
                  <SelectItem value="userstories">User Stories</SelectItem>
                  <SelectItem value="roadmap">Roadmap</SelectItem>
                  <SelectItem value="releasenote">Release Note</SelectItem>
                  <SelectItem value="pitch">Pitch</SelectItem>
                  <SelectItem value="techspec">Spec Técnica</SelectItem>
                  <SelectItem value="testplan">Plano de Testes</SelectItem>
                  <SelectItem value="apidoc">Doc de API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-content">Conteúdo do Template</Label>
              <Textarea
                id="template-content"
                value={newTemplate.content}
                onChange={(e) => 
                  setNewTemplate({ ...newTemplate, content: e.target.value })
                }
                className="min-h-[300px] font-mono text-sm"
                placeholder="Defina a estrutura do seu template aqui..."
              />
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-medium mb-2">Dicas para Templates:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Use emojis para seções principais (📄, 📘, ⚙️, etc.)</li>
                <li>Use # para títulos principais e ## para subtítulos</li>
                <li>Use - para listas de itens</li>
                <li>Deixe espaços para conteúdo dinâmico entre colchetes []</li>
                <li>Mantenha a estrutura clara e consistente</li>
              </ul>
            </div>

            <DialogFooter className="flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                <X className="mr-2" size={16} />
                Cancelar
              </Button>
              <Button onClick={handleSaveTemplate}>
                <Save className="mr-2" size={16} />
                Salvar Template
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Nenhum template encontrado para este tipo de documento.
                </p>
                <Button onClick={() => setIsEditing(true)}>
                  <Plus className="mr-2" size={16} />
                  Criar Novo Template
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors ${
                      selectedTemplate?.id === template.id
                        ? "border-primary bg-accent"
                        : "border-input"
                    }`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{template.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Tipo: {getTypeLabel(template.type)}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {template.content.split("\n")[0]}
                        </p>
                      </div>
                      {template.isCustom && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedTemplate && (
              <div className="mt-6 border-t pt-4">
                <h4 className="font-medium mb-2">Preview do Template:</h4>
                <div className="bg-muted p-4 rounded-lg text-sm font-mono max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{selectedTemplate.content}</pre>
                </div>

                <DialogFooter className="mt-4 flex items-center justify-end space-x-2">
                  <Button variant="outline" onClick={onClose}>
                    <X className="mr-2" size={16} />
                    Cancelar
                  </Button>
                  <Button onClick={handleUseTemplate}>
                    <Edit2 className="mr-2" size={16} />
                    Usar Este Template
                  </Button>
                </DialogFooter>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function getTypeLabel(type: string) {
  const typeLabels: Record<string, string> = {
    prd: "PRD",
    epic: "Épico",
    userstories: "User Stories",
    roadmap: "Roadmap",
    releasenote: "Release Note",
    pitch: "Pitch",
    techspec: "Spec Técnica",
    testplan: "Plano de Testes",
    apidoc: "Doc de API",
  };
  return typeLabels[type] || type;
}