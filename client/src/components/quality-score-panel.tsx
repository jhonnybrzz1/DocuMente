import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Loader2, Sparkles, ListChecks, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DocumentType, QualityScore } from "@shared/schema";

interface QualityScorePanelProps {
  content: string;
  type: DocumentType | "";
  documentId?: number;
  defaultExpanded?: boolean;
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bom";
  if (score >= 40) return "Regular";
  return "Precisa melhorar";
}

export default function QualityScorePanel({
  content,
  type,
  documentId,
  defaultExpanded = false,
}: QualityScorePanelProps) {
  const { toast } = useToast();
  const [score, setScore] = useState<QualityScore | null>(null);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!type) throw new Error("Tipo de documento não definido.");
      if (!content || content.trim().length < 50) {
        throw new Error("Conteúdo muito curto pra avaliar (mínimo 50 caracteres).");
      }

      const res = await apiRequest("POST", "/api/ai/quality-score", {
        type,
        content,
        documentId,
      });
      return (await res.json()) as QualityScore;
    },
    onSuccess: (data) => {
      setScore(data);
      setExpanded(true);
    },
    onError: (err: Error) => {
      toast({
        title: "Erro ao avaliar",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks size={18} className="text-primary" />
            Score de Qualidade
          </CardTitle>
          <div className="flex items-center gap-2">
            {score && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(e => !e)}
                aria-label={expanded ? "Recolher" : "Expandir"}
              >
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !type}
              className="gap-2"
            >
              {mutation.isPending ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Sparkles size={14} />
              )}
              {score ? "Reavaliar" : "Avaliar"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {score && expanded && (
        <CardContent className="space-y-4">
          {/* Score geral */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`text-4xl font-bold ${scoreColor(score.overall)}`}>
                {score.overall}
              </div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>
            <div className="flex-1">
              <div className={`font-semibold ${scoreColor(score.overall)}`}>
                {scoreLabel(score.overall)}
              </div>
              <Progress value={score.overall} className="h-2 mt-1" />
            </div>
          </div>

          {/* Dimensões */}
          {score.dimensions.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Avaliação por dimensão</div>
              {score.dimensions.map((dim, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{dim.name}</span>
                    <span className={scoreColor(dim.score)}>{dim.score}/100</span>
                  </div>
                  <Progress value={dim.score} className="h-1.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{dim.feedback}</p>
                </div>
              ))}
            </div>
          )}

          {/* Sugestões */}
          {score.suggestions.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <div className="text-sm font-medium flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-500" />
                Sugestões de melhoria
              </div>
              <ul className="space-y-1.5 text-sm">
                {score.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t">
            Avaliado em {new Date(score.evaluatedAt).toLocaleString("pt-BR")}
          </div>
        </CardContent>
      )}

      {!score && !mutation.isPending && (
        <CardContent className="pt-0 text-sm text-muted-foreground">
          Clique em <strong>Avaliar</strong> pra ter uma análise por dimensões e sugestões concretas de melhoria.
        </CardContent>
      )}
    </Card>
  );
}
