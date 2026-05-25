import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { MessageSquare, Send, Loader2, Sparkles, Check, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DocumentType } from "@shared/schema";

interface RefineChatProps {
  documentContent: string;
  documentType: DocumentType | "";
  onApplyUpdate: (newContent: string) => void;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  proposedUpdate?: string | null;
}

const SUGGESTIONS = [
  "Encurte mantendo o essencial",
  "Adicione exemplos concretos",
  "Use tom mais formal",
  "Liste os principais riscos",
  "Adicione critérios de aceite",
];

export default function RefineChat({
  documentContent,
  documentType,
  onApplyUpdate,
}: RefineChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll para a última mensagem
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const mutation = useMutation({
    mutationFn: async (userText: string) => {
      if (!documentType) throw new Error("Tipo de documento não definido.");
      if (!documentContent.trim()) throw new Error("Documento vazio.");

      const newMessages: ChatMsg[] = [
        ...messages,
        { role: "user", content: userText },
      ];
      setMessages(newMessages);

      const res = await apiRequest("POST", "/api/ai/chat", {
        documentContent,
        documentType,
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      });
      const data = (await res.json()) as {
        response: string;
        updatedContent: string | null;
      };

      return data;
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          proposedUpdate: data.updatedContent,
        },
      ]);
      setInput("");
    },
    onError: (err: Error) => {
      toast({
        title: "Erro no chat",
        description: err.message,
        variant: "destructive",
      });
      // Remove a última mensagem do usuário em caso de erro
      setMessages(prev => prev.slice(0, -1));
    },
  });

  const send = (text: string) => {
    if (!text.trim() || mutation.isPending) return;
    mutation.mutate(text.trim());
  };

  const applyUpdate = (newContent: string) => {
    onApplyUpdate(newContent);
    toast({
      title: "Documento atualizado",
      description: "O conteúdo foi substituído com a proposta da IA.",
    });
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" />
            Refinar com IA
          </CardTitle>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([])}
              className="gap-1 text-xs"
              title="Limpar conversa"
            >
              <RotateCcw size={12} />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 min-h-0 gap-3">
        {/* Mensagens */}
        <ScrollArea className="flex-1 -mx-2 px-2" ref={scrollRef as any}>
          <div className="space-y-3 pb-2">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Peça pra IA ajustar este documento. Ela pode encurtar, expandir, mudar o tom, traduzir, etc.
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-accent transition-colors"
                      disabled={mutation.isPending}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  {m.proposedUpdate && (
                    <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-2">
                      <Sparkles size={12} className="shrink-0" />
                      <span className="text-xs flex-1">Documento atualizado disponível</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 gap-1"
                        onClick={() => applyUpdate(m.proposedUpdate!)}
                      >
                        <Check size={12} />
                        Aplicar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {mutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="animate-spin" size={14} />
                  Pensando...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2 shrink-0">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Peça um ajuste... (Enter para enviar)"
            rows={2}
            className="resize-none text-sm"
            disabled={mutation.isPending}
          />
          <Button
            onClick={() => send(input)}
            disabled={!input.trim() || mutation.isPending}
            size="icon"
            className="shrink-0 self-end h-9 w-9"
            aria-label="Enviar"
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
