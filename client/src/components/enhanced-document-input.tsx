import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Edit, LayoutTemplate, Sparkles, Loader2, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DocumentType } from "@shared/schema";
import TagInput from "./tag-input";

interface EnhancedDocumentInputProps {
  demand: string;
  setDemand: (value: string) => void;
  title: string;
  setTitle: (value: string) => void;
  onUseTemplate: () => void;
  selectedType?: DocumentType | "";
  tags?: string[];
  setTags?: (tags: string[]) => void;
}

export default function EnhancedDocumentInput({
  demand,
  setDemand,
  title,
  setTitle,
  onUseTemplate,
  selectedType,
  tags = [],
  setTags,
}: EnhancedDocumentInputProps) {
  const characterCount = demand.length;
  const maxCharacters = 10000;
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const suggestTitleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedType) {
        throw new Error("Selecione um tipo de documento antes de sugerir título.");
      }
      if (demand.trim().length < 10) {
        throw new Error("Descreva a demanda primeiro (mínimo 10 caracteres).");
      }
      const res = await apiRequest("POST", "/api/ai/suggest-title", {
        type: selectedType,
        demand,
      });
      return (await res.json()) as { suggestions: string[] };
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions);
    },
    onError: (err: Error) => {
      toast({
        title: "Erro ao sugerir título",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const applySuggestion = (s: string) => {
    setTitle(s);
    setSuggestions([]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Edit className="text-primary mr-2" size={20} />
            Inserir Demanda ou Documentos
          </CardTitle>
            <Button variant="outline" size="sm" onClick={onUseTemplate}>
              <LayoutTemplate className="mr-2" size={16} />
              Usar Template
            </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="document-title" className="block text-sm font-medium text-foreground mb-2">
            Título do Documento <span className="text-destructive" aria-hidden="true">*</span>
            <span className="sr-only">(obrigatório)</span>
          </label>
          <div className="flex gap-2">
            <Input
              id="document-title"
              placeholder="Ex: Login Social Mobile, Dashboard Analytics, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-required="true"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => suggestTitleMutation.mutate()}
              disabled={suggestTitleMutation.isPending}
              title="Sugerir títulos com IA"
              aria-label="Sugerir títulos com IA"
            >
              {suggestTitleMutation.isPending ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              <span className="ml-2 hidden sm:inline">Sugerir</span>
            </Button>
          </div>
          {suggestions.length > 0 && (
            <div className="mt-2 p-2 border border-border rounded-md bg-muted/40 space-y-1">
              <div className="text-xs text-muted-foreground mb-1 px-1">
                Sugestões da IA — clique para aplicar:
              </div>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applySuggestion(s)}
                  className="block w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="document-demand" className="block text-sm font-medium text-foreground mb-2">
            Descrição da Demanda <span className="text-destructive" aria-hidden="true">*</span>
            <span className="sr-only">(obrigatório)</span>
          </label>
          <Textarea
            id="document-demand"
            placeholder="Descreva sua demanda ou cole documentos existentes aqui para refinamento...\n\nExemplo: 'Preciso criar uma funcionalidade de login social para o aplicativo móvel que permita aos usuários fazer login usando Google e Facebook, com autenticação segura e sincronização de dados do perfil.'"
            rows={8}
            value={demand}
            onChange={(e) => setDemand(e.target.value)}
            className="resize-none"
            maxLength={maxCharacters}
            aria-required="true"
          />
          
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
            <span>{characterCount} caracteres</span>
            <span>Máximo: {maxCharacters.toLocaleString()} caracteres</span>
          </div>
        </div>

        {setTags && (
          <div>
            <label htmlFor="document-tags" className="block text-sm font-medium text-foreground mb-2">
              <Tag className="inline mr-1" size={14} />
              Tags (opcional)
            </label>
            <TagInput
              id="document-tags"
              tags={tags}
              onChange={setTags}
              placeholder="Ex: Q1-2026, squad-growth, checkout..."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}