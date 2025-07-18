import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plug, CheckCircle, AlertCircle } from "lucide-react";

export default function ApiKeyConfig() {
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  const { data: activeApiKey } = useQuery({
    queryKey: ["/api/api-keys/active"],
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await apiRequest("POST", "/api/test-connection", { apiKey: key });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Conexão bem-sucedida",
        description: "A API key do Mistral está funcionando corretamente.",
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

  const saveApiKeyMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await apiRequest("POST", "/api/api-keys", { mistralKey: key });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "API Key salva",
        description: "A chave da API foi salva com sucesso.",
        variant: "default",
      });
      setApiKey("");
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Falha ao salvar a API key.",
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = () => {
    const keyToTest = apiKey || activeApiKey?.mistralKey;
    if (!keyToTest) {
      toast({
        title: "API Key necessária",
        description: "Por favor, insira uma API key para testar.",
        variant: "destructive",
      });
      return;
    }
    testConnectionMutation.mutate(keyToTest);
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key necessária",
        description: "Por favor, insira uma API key.",
        variant: "destructive",
      });
      return;
    }
    saveApiKeyMutation.mutate(apiKey);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chave da API Mistral
            </label>
            <Input
              type="password"
              placeholder={activeApiKey ? "••••••••••••••••" : "sk-..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && apiKey) {
                  handleSaveApiKey();
                }
              }}
            />
          </div>
          <div className="flex items-end space-x-2">
            <Button
              onClick={handleTestConnection}
              disabled={testConnectionMutation.isPending}
              variant="outline"
              className="flex-1"
            >
              <Plug className="mr-2" size={16} />
              Testar
            </Button>
            {apiKey && (
              <Button
                onClick={handleSaveApiKey}
                disabled={saveApiKeyMutation.isPending}
                className="flex-1"
              >
                Salvar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
