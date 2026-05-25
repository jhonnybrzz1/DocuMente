import { useMutation } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Sparkles, Loader2, FileText, Maximize2, RotateCw, SpellCheck, Languages, ListChecks, type LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export type QuickAction =
  | "summarize"
  | "expand"
  | "rewrite"
  | "fix-grammar"
  | "translate-en"
  | "validate-invest";

interface ActionConfig {
  value: QuickAction;
  label: string;
  description: string;
  icon: LucideIcon;
  showFor?: ("generic" | "userstories" | "epic")[];
}

const ACTIONS: ActionConfig[] = [
  { value: "summarize", label: "Resumir", description: "Condensar mantendo essência", icon: FileText },
  { value: "expand", label: "Expandir", description: "Adicionar exemplos e detalhes", icon: Maximize2 },
  { value: "rewrite", label: "Reescrever", description: "Mais claro e profissional", icon: RotateCw },
  { value: "fix-grammar", label: "Corrigir gramática", description: "Ortografia e pontuação", icon: SpellCheck },
  { value: "translate-en", label: "Traduzir para inglês", description: "Versão em inglês profissional", icon: Languages },
  { value: "validate-invest", label: "Validar INVEST", description: "Avaliar user stories", icon: ListChecks },
];

interface AIQuickActionsProps {
  /**
   * Texto a ser processado. Se `getSelection` for fornecido, ele é chamado primeiro
   * e usa a seleção atual do textarea. Caso vazio, usa o texto completo.
   */
  text: string;
  getSelection?: () => string | undefined;
  onResult: (result: string, action: QuickAction, replaceSelection: boolean) => void;
  context?: string;
  disabled?: boolean;
  /** Variante visual do botão */
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default";
}

export default function AIQuickActions({
  text,
  getSelection,
  onResult,
  context,
  disabled,
  variant = "outline",
  size = "sm",
}: AIQuickActionsProps) {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async ({ action }: { action: QuickAction }) => {
      const selection = getSelection?.();
      const target = selection && selection.trim().length > 0 ? selection : text;
      const replaceSelection = !!(selection && selection.trim().length > 0);

      if (!target || target.trim().length === 0) {
        throw new Error("Não há texto para processar.");
      }

      const res = await apiRequest("POST", "/api/ai/quick-action", {
        text: target,
        action,
        context,
      });
      const data = (await res.json()) as { result: string };
      return { result: data.result, action, replaceSelection };
    },
    onSuccess: ({ result, action, replaceSelection }) => {
      onResult(result, action, replaceSelection);
      toast({
        title: "Ação aplicada",
        description: `${ACTIONS.find(a => a.value === action)?.label} concluído.`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Erro na ação rápida",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || mutation.isPending}
          className="gap-2"
        >
          {mutation.isPending ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <Sparkles size={14} />
          )}
          Ações IA
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>Ações rápidas com IA</span>
            <span className="text-xs text-muted-foreground font-normal">
              Aplica em texto selecionado ou completo
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.value}
              onClick={() => mutation.mutate({ action: action.value })}
              disabled={mutation.isPending}
              className="cursor-pointer"
            >
              <Icon size={14} className="mr-2 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm">{action.label}</span>
                <span className="text-xs text-muted-foreground">{action.description}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
