import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plug, CheckCircle, AlertCircle } from "lucide-react";

export default function ApiKeyConfig() {
  const { toast } = useToast();

  const { data: activeApiKey } = useQuery({
    queryKey: ["/api/api-keys/active"],
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/test-connection");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Conexão verificada",
        description: "A API do Mistral está funcionando corretamente.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na conexão",
        description: error.message || "Falha ao conectar com a API do Mistral.",
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = () => {
    if (!activeApiKey) {
      toast({
        title: "API não configurada",
        description: "Nenhuma chave da API está configurada no sistema.",
        variant: "destructive",
      });
      return;
    }
    testConnectionMutation.mutate();
  };

  const isConnected = activeApiKey && !testConnectionMutation.isError;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Configuração da API</span>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <CheckCircle className="w-3 h-3 text-success" />
                <span className="text-sm text-success font-medium">Conectado</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-warning" />
                <span className="text-sm text-warning font-medium">Não configurado</span>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {isConnected 
                ? "API do Mistral configurada e funcionando" 
                : "Verificando configuração da API..."
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Sistema configurado automaticamente
            </p>
          </div>
          <Button
            onClick={handleTestConnection}
            disabled={testConnectionMutation.isPending || !activeApiKey}
            variant="outline"
            size="sm"
          >
            <Plug className="mr-2" size={16} />
            {testConnectionMutation.isPending ? "Testando..." : "Verificar Conexão"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
