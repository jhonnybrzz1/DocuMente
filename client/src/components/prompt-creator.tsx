import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PromptCreatorProps {
  document: {
    id: number;
    title: string;
    type: string;
    content: string;
  };
}

export default function PromptCreator({ document }: PromptCreatorProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState<string>("");
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");

  const generatePrompt = () => {
    // Generate a prompt based on the document type and content and user instructions
    let generated = "";

    // Apply text formatting rules based on user instructions
    const formattedPrompt = applyTextFormatting(prompt);

    switch (document.type) {
      case "documentation":
        generated = `Crie uma documentação detalhada para o seguinte conteúdo:\n\n"""${document.content}"""\n\n${formattedPrompt}\n\nPor favor, inclua:\n- Visão geral\n- Instruções de instalação\n- Exemplos de uso\n- Tratamento de erros\n- Testes unitários`;
        break;
      case "code":
        generated = `Analise o seguinte código e forneça uma explicação detalhada:\n\n"""${document.content}"""\n\n${formattedPrompt}\n\nPor favor, inclua:\n- Visão geral da funcionalidade\n- Explicação detalhada do código\n- Pontos de atenção\n- Possíveis melhorias`;
        break;
      case "requirements":
        generated = `Analise os seguintes requisitos e forneça uma especificação detalhada:\n\n"""${document.content}"""\n\n${formattedPrompt}\n\nPor favor, inclua:\n- Visão geral dos requisitos\n- Especificações técnicas\n- Critérios de aceitação\n- Possíveis riscos e mitigações`;
        break;
      default:
        generated = `Analise o seguinte conteúdo e forneça uma explicação detalhada:\n\n"""${document.content}"""\n\n${formattedPrompt}`;
    }

    setGeneratedPrompt(generated);
    toast({
      title: "Prompt gerado",
      description: "O prompt foi gerado com sucesso.",
      variant: "default",
    });
  };

  const applyTextFormatting = (text: string) => {
    // Apply text formatting rules
    let formatted = text;

    // Emphasize important parts using asterisks and uppercase
    formatted = formatted.replace(/\*([^*]+)\*/g, (match, p1) => `**${p1.toUpperCase()}**`);

    // Support delimiters
    formatted = formatted.replace(/"([^"]+)"/g, (match, p1) => `"${p1}"`);
    formatted = formatted.replace(/```([^`]+)```/g, (match, p1) => `"""${p1}"""`);

    // Support placeholders
    formatted = formatted.replace(/\{([^}]+)\}/g, (match, p1) => `{${p1}}`);
    formatted = formatted.replace(/\{([^}]+)\}/g, (match, p1) => `[${p1}]`);

    // Support structure elements
    formatted = formatted.replace(/#([^#]+)#/g, (match, p1) => `# ${p1} #`);
    formatted = formatted.replace(/<([^>]+)>/g, (match, p1) => `<${p1}>`);

    return formatted;
  };
    // Generate a prompt based on the document type and content
    let generated = "";

    switch (document.type) {
      case "documentation":
        generated = `Crie uma documentação detalhada para o seguinte conteúdo:\n\n"""${document.content}"""\n\nPor favor, inclua:\n- Visão geral\n- Instruções de instalação\n- Exemplos de uso\n- Tratamento de erros\n- Testes unitários`;
        break;
      case "code":
        generated = `Analise o seguinte código e forneça uma explicação detalhada:\n\n"""${document.content}"""\n\nPor favor, inclua:\n- Visão geral da funcionalidade\n- Explicação detalhada do código\n- Pontos de atenção\n- Possíveis melhorias`;
        break;
      case "requirements":
        generated = `Analise os seguintes requisitos e forneça uma especificação detalhada:\n\n"""${document.content}"""\n\nPor favor, inclua:\n- Visão geral dos requisitos\n- Especificações técnicas\n- Critérios de aceitação\n- Possíveis riscos e mitigações`;
        break;
      default:
        generated = `Analise o seguinte conteúdo e forneça uma explicação detalhada:\n\n"""${document.content}"""`;
    }

    setGeneratedPrompt(generated);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Criador de Prompts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="prompt-input" className="text-sm font-medium">
            Instruções para o Prompt
          </label>
          <Textarea
            id="prompt-input"
            value={prompt}
            onChange={handleInputChange}
            placeholder="Digite as instruções para o prompt..."
            className="min-h-[100px]"
          />
        </div>
        <div className="flex space-x-2">
          <Button onClick={generatePrompt} className="flex-1">
            Gerar Prompt
          </Button>
          <Button onClick={copyToClipboard} className="flex-1" disabled={!generatedPrompt}>
            Copiar
          </Button>
          <Button onClick={clearPrompt} className="flex-1" disabled={!generatedPrompt}>
            Limpar
          </Button>
        </div>
        {generatedPrompt && (
          <div className="space-y-2">
            <label htmlFor="generated-prompt" className="text-sm font-medium">
              Prompt Gerado
            </label>
            <Textarea
              id="generated-prompt"
              value={generatedPrompt}
              readOnly
              className="min-h-[200px]"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
