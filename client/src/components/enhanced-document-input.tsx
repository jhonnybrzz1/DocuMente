import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Edit, LayoutTemplate, Sparkles, Loader2, Tag, Mic, MicOff, Github } from "lucide-react";
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
  setSelectedType?: (value: DocumentType | "") => void;
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
  setSelectedType,
  tags = [],
  setTags,
}: EnhancedDocumentInputProps) {
  const characterCount = demand.length;
  const maxCharacters = 10000;
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [showGithubInput, setShowGithubInput] = useState(false);

  const importGithubMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/ai/github-repo", {
        repoUrl: url,
      });
      return res.json();
    },
    onSuccess: (data: { owner: string; repo: string; description: string; contextText: string }) => {
      setDemand(data.contextText);
      setTitle(`Documentação Técnica - ${data.owner}/${data.repo}`);
      if (setSelectedType) {
        setSelectedType("techspec"); // Tipo ideal para código/repositórios
      }
      setShowGithubInput(false);
      setGithubUrl("");
      toast({
        title: "Repositório Importado",
        description: `O código de ${data.owner}/${data.repo} foi carregado como Spec Técnica!`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Erro ao importar GitHub",
        description: err.message || "Verifique se a URL está correta e o repositório é público.",
        variant: "destructive",
      });
    },
  });

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Recurso indisponível",
        description: "Seu navegador não suporta reconhecimento de voz nativo. Tente usar o Google Chrome ou Edge.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      (window as any)._recognitionInstance?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "pt-BR";

      recognition.onstart = () => {
        setIsListening(true);
        toast({
          title: "Microfone ativado",
          description: "Ouvindo... Fale a sua demanda.",
        });
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        toast({
          title: "Erro de captura",
          description: `Erro ao capturar voz: ${event.error}`,
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (transcript) {
          setDemand(demand ? `${demand}\n${transcript.trim()}` : transcript.trim());
        }
      };

      (window as any)._recognitionInstance = recognition;
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setIsListening(false);
    }
  };

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
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center">
            <Edit className="text-primary mr-2" size={20} />
            Inserir Demanda ou Documentos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowGithubInput(!showGithubInput)}
              className={showGithubInput ? "bg-accent" : ""}
            >
              <Github className="mr-2" size={16} />
              Importar GitHub
            </Button>
            <Button variant="outline" size="sm" onClick={onUseTemplate}>
              <LayoutTemplate className="mr-2" size={16} />
              Usar Template
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showGithubInput && (
          <div className="p-3 border border-border rounded-md bg-muted/40 space-y-2">
            <label htmlFor="github-url-input" className="block text-xs font-medium text-muted-foreground">
              Link de Repositório do GitHub (Público)
            </label>
            <div className="flex gap-2">
              <Input
                id="github-url-input"
                placeholder="Ex: https://github.com/drizzle-team/drizzle-orm"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="flex-1 text-sm h-9"
              />
              <Button
                size="sm"
                onClick={() => importGithubMutation.mutate(githubUrl)}
                disabled={importGithubMutation.isPending || !githubUrl.trim()}
              >
                {importGithubMutation.isPending ? (
                  <Loader2 className="animate-spin mr-2" size={14} />
                ) : (
                  <Github className="mr-2" size={14} />
                )}
                Importar
              </Button>
            </div>
          </div>
        )}

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
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="document-demand" className="block text-sm font-medium text-foreground">
              Descrição da Demanda <span className="text-destructive" aria-hidden="true">*</span>
              <span className="sr-only">(obrigatório)</span>
            </label>
            <Button
              type="button"
              variant={isListening ? "destructive" : "outline"}
              size="sm"
              onClick={toggleListening}
              className={`h-8 px-3 ${isListening ? "animate-pulse border-destructive text-destructive bg-destructive/10" : ""}`}
              title={isListening ? "Parar gravação" : "Digitar por voz"}
            >
              {isListening ? (
                <>
                  <MicOff className="mr-2 animate-bounce" size={14} />
                  Ouvindo...
                </>
              ) : (
                <>
                  <Mic className="mr-2" size={14} />
                  Gravar Voz
                </>
              )}
            </Button>
          </div>
          <Textarea
            id="document-demand"
            placeholder="Descreva sua demanda, fale usando o microfone ou cole documentos existentes aqui para refinamento...\n\nExemplo: 'Preciso criar uma funcionalidade de login social para o aplicativo móvel que permita aos usuários fazer login usando Google e Facebook, com autenticação segura e sincronização de dados do perfil.'"
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