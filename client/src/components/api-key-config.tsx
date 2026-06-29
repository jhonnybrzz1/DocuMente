import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plug, CheckCircle, AlertCircle, Sparkles, ShieldCheck, Cpu } from "lucide-react";
import type { ApiKey } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type ActiveApiKeyStatus = Partial<ApiKey> & {
  configured: boolean;
  provider?: string;
  model?: string;
  mistralKey: string | null;
};

export default function ApiKeyConfig() {
  const { toast } = useToast();
  const [plan, setPlan] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("docu_user_plan") || "pro";
    }
    return "pro";
  });

  const { data: activeApiKey } = useQuery<ActiveApiKeyStatus>({
    queryKey: ["/api/api-keys/active"],
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/test-connection", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Conexão verificada",
        description: "A API da OpenRouter está funcionando corretamente.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na conexão",
        description: error.message || "Falha ao conectar com a API da OpenRouter.",
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = () => {
    if (!activeApiKey?.configured) {
      toast({
        title: "API não configurada",
        description: "OPENROUTER_API_KEY não está configurada no servidor.",
        variant: "destructive",
      });
      return;
    }
    testConnectionMutation.mutate();
  };

  const handlePlanChange = (newPlan: string) => {
    setPlan(newPlan);
    localStorage.setItem("docu_user_plan", newPlan);
    toast({
      title: `Plano alterado: ${newPlan.toUpperCase()}`,
      description: `Configuração de roteamento de IA atualizada para o perfil selecionado.`,
      variant: "default",
    });
  };

  const isConnected = Boolean(activeApiKey?.configured) && !testConnectionMutation.isError;

  return (
    <Card className="border border-input shadow-md bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base font-semibold">
          <span>Ambiente & Roteamento IA</span>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-xs text-success font-medium">API Conectada</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-warning" />
                <span className="text-xs text-warning font-medium">API Offline</span>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-3 rounded-lg border border-input/60">
          <div>
            <p className="text-sm font-medium text-foreground">
              {isConnected 
                ? "OpenRouter API Gateway" 
                : "Conexão com Provedor de IA"
              }
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Modelo base: {activeApiKey?.model ?? "google/gemma-4-31b-it"}
            </p>
          </div>
          <Button
            onClick={handleTestConnection}
            disabled={testConnectionMutation.isPending || !activeApiKey?.configured}
            variant="outline"
            size="sm"
            className="self-start md:self-center"
          >
            <Plug className="mr-2" size={14} />
            {testConnectionMutation.isPending ? "Testando..." : "Testar Latência"}
          </Button>
        </div>

        <div className="pt-2 border-t border-input/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="user-plan-selector" className="text-sm font-medium flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-primary" />
              Plano de IA (Model Tiering)
            </Label>
            <p className="text-xs text-muted-foreground">
              Determina quais modelos serão usados para verificação de fidelidade e qualidade.
            </p>
          </div>
          <div className="min-w-[180px]">
            <Select value={plan} onValueChange={handlePlanChange}>
              <SelectTrigger id="user-plan-selector" className="w-full">
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Gratuito (Free)</span>
                  </span>
                </SelectItem>
                <SelectItem value="pro">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Profissional (Pro)</span>
                  </span>
                </SelectItem>
                <SelectItem value="enterprise">
                  <span className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                    <span>Corporativo (Ent)</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
