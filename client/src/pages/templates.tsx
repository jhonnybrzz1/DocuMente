import { useState } from "react";
import AppHeader from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Save, Trash2, FileText, Search, X, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DocumentType } from "@shared/schema";

interface Template {
  id: string;
  name: string;
  type: DocumentType;
  content: string;
  isCustom: boolean;
  category: string;
}

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>(getDefaultTemplates());
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    type: "prd" as DocumentType,
    content: "",
    category: "geral",
  });

  function getDefaultTemplates(): Template[] {
    return [
      {
        id: "prd-standard",
        name: "PRD Padrão",
        type: "prd",
        content: "📄 **PRD (Product Requirements Document)**\n\n## Visão Geral do Produto\n\n## Cenário Atual (Problema)\n\n## Solução Proposta\n\n## Requisitos Funcionais\n\n## Casos de Uso\n\n## Fluxo de Funcionamento\n\n## Validações\n\n## Dependências\n\n## Resultados Esperados\n\n## Métricas de Sucesso",
        isCustom: false,
        category: "geral",
      },
      {
        id: "userstories-standard",
        name: "User Stories Padrão",
        type: "userstories",
        content: "🧩 **User Stories**\n\nComo [tipo de usuário], eu quero [ação], para [benefício].\n\n**Critérios de Aceite:**\n- [Critério 1]\n- [Critério 2]\n- [Critério 3]",
        isCustom: false,
        category: "geral",
      },
      {
        id: "techspec-standard",
        name: "Especificação Técnica Padrão",
        type: "techspec",
        content: "⚙️ **Especificação Técnica**\n\n## Visão Geral Técnica\n\n## Arquitetura Proposta\n\n## Tecnologias Utilizadas\n\n## Requisitos Técnicos\n\n## Interfaces e APIs\n\n## Considerações de Performance\n\n## Segurança\n\n## Testes Técnicos\n\n## Deployment e Infraestrutura",
        isCustom: false,
        category: "técnico",
      },
      {
        id: "roadmap-agile",
        name: "Roadmap Ágil",
        type: "roadmap",
        content: "🗓️ **Cronograma de Produto (Roadmap Ágil)**\n\n## Visão do Produto\n\n## Objetivos Estratégicos\n\n## Entregas por Sprint\n\n### Sprint 1: [Data]\n- [Feature 1]\n- [Feature 2]\n\n### Sprint 2: [Data]\n- [Feature 3]\n- [Feature 4]\n\n## Marcos Principais (Milestones)\n\n## Dependências e Riscos\n\n## Métricas de Progresso",
        isCustom: false,
        category: "geral",
      },
    ];
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || template.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleSaveTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast({
        title: "Erro",
        description: "Nome e conteúdo são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const templateToAdd = {
      ...newTemplate,
      id: editingTemplate ? editingTemplate.id : `custom-${Date.now()}`,
      isCustom: true,
    };

    if (editingTemplate) {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? templateToAdd : t));
      toast({
        title: "Template atualizado",
        description: "Seu template foi atualizado com sucesso.",
        variant: "default",
      });
    } else {
      setTemplates([...templates, templateToAdd]);
      toast({
        title: "Template salvo",
        description: "Seu template personalizado foi salvo com sucesso.",
        variant: "default",
      });
    }

    setIsEditing(false);
    setEditingTemplate(null);
    setNewTemplate({
      name: "",
      type: "prd" as DocumentType,
      content: "",
      category: "geral",
    });
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      type: template.type,
      content: template.content,
      category: template.category,
    });
    setIsEditing(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter((t) => t.id !== templateId));

    toast({
      title: "Template excluído",
      description: "O template foi removido com sucesso.",
      variant: "default",
    });
  };

  const getTypeLabel = (type: string) => {
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
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Biblioteca de Templates</h1>
          <Button onClick={() => {
            setIsEditing(true);
            setEditingTemplate(null);
            setNewTemplate({
              name: "",
              type: "prd" as DocumentType,
              content: "",
              category: "geral",
            });
          }}>
            <Plus className="mr-2" size={16} />
            Novo Template
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Buscar templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="técnico">Técnico</TabsTrigger>
                <TabsTrigger value="negócios">Negócios</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {isEditing ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 text-primary" size={20} />
                {editingTemplate ? "Editar Template" : "Novo Template"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="template-category">Categoria</Label>
                  <Select
                    value={newTemplate.category}
                    onValueChange={(value) => 
                      setNewTemplate({ ...newTemplate, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Geral</SelectItem>
                      <SelectItem value="técnico">Técnico</SelectItem>
                      <SelectItem value="negócios">Negócios</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

              <div className="flex items-center justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingTemplate(null);
                  }}
                >
                  <X className="mr-2" size={16} />
                  Cancelar
                </Button>
                <Button onClick={handleSaveTemplate}>
                  <Save className="mr-2" size={16} />
                  {editingTemplate ? "Atualizar Template" : "Salvar Template"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 col-span-full">
                <p className="text-muted-foreground mb-4">
                  Nenhum template encontrado.
                </p>
                <Button onClick={() => setIsEditing(true)}>
                  <Plus className="mr-2" size={16} />
                  Criar Primeiro Template
                </Button>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="mr-2 text-primary" size={16} />
                        {template.name}
                      </CardTitle>
                      {template.isCustom && (
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTemplate(template);
                            }}
                            className="text-blue-400 hover:text-blue-600 p-1"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                            className="text-destructive hover:text-destructive p-1"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="bg-muted px-2 py-1 rounded">
                          {getTypeLabel(template.type)}
                        </span>
                        <span className="bg-muted px-2 py-1 rounded">
                          {template.category}
                        </span>
                        {template.isCustom && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Personalizado
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {template.content.split("\n")[0]}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}