import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface PromptGeneratorButtonProps {
  document: {
    id: number;
    title: string;
    type: string;
    content: string;
  };
}

export default function PromptGeneratorButton({ document }: PromptGeneratorButtonProps) {
  const { toast } = useToast();
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");

  const generatePrompt = () => {
    // Generate a prompt based on the document type and content
    let prompt = "";

    switch (document.type) {
      case "documentation":
        prompt = `Crie uma documentação detalhada para o seguinte conteúdo:\n\n${document.content}\n\nPor favor, inclua:\n- Visão geral\n- Instruções de instalação\n- Exemplos de uso\n- Tratamento de erros\n- Testes unitários`;
        break;
      case "code":
        prompt = `Analise o seguinte código e forneça uma explicação detalhada:\n\n${document.content}\n\nPor favor, inclua:\n- Visão geral da funcionalidade\n- Explicação detalhada do código\n- Pontos de atenção\n- Possíveis melhorias`;
        break;
      case "requirements":
        prompt = `Analise os seguintes requisitos e forneça uma especificação detalhada:\n\n${document.content}\n\nPor favor, inclua:\n- Visão geral dos requisitos\n- Especificações técnicas\n- Critérios de aceitação\n- Possíveis riscos e mitigações`;
        break;
      default:
        prompt = `Analise o seguinte conteúdo e forneça uma explicação detalhada:\n\n${document.content}`;
    }

    setGeneratedPrompt(prompt);
    toast({
      title: "Prompt gerado",
      description: "O prompt foi gerado com sucesso.",
      variant: "default",
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt).then(() => {
      toast({
        title: "Prompt copiado",
        description: "O prompt foi copiado para a área de transferência.",
        variant: "default",
      });
    }).catch(() => {
      toast({
        title: "Erro ao copiar",
        description: "Falha ao copiar o prompt para a área de transferência.",
        variant: "destructive",
      });
    });
  };

  const clearPrompt = () => {
    setGeneratedPrompt("");
  };

  return (
    <div className="flex flex-col space-y-2">
      <Button onClick={generatePrompt} className="w-full">
        Gerar Prompt
      </Button>
      {generatedPrompt && (
        <div className="flex flex-col space-y-2">
          <textarea
            value={generatedPrompt}
            readOnly
            className="w-full p-2 border rounded"
            rows={5}
          />
          <div className="flex space-x-2">
            <Button onClick={copyToClipboard} className="flex-1">
              Copiar
            </Button>
            <Button onClick={clearPrompt} className="flex-1">
              Limpar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
