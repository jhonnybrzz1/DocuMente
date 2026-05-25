import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Link2, Copy, Loader2, Trash2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number | null;
  documentTitle: string;
  initialShareToken?: string | null;
  onUpdate?: (newToken: string | null) => void;
}

export default function ShareDialog({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  initialShareToken,
  onUpdate,
}: ShareDialogProps) {
  const { toast } = useToast();
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken ?? null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShareToken(initialShareToken ?? null);
    setCopied(false);
  }, [initialShareToken, isOpen]);

  const shareUrl = shareToken
    ? `${window.location.origin}/share/${shareToken}`
    : "";

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!documentId) throw new Error("Documento inválido");
      const res = await apiRequest("POST", `/api/documents/${documentId}/share`, {});
      return (await res.json()) as { shareToken: string };
    },
    onSuccess: (data) => {
      setShareToken(data.shareToken);
      onUpdate?.(data.shareToken);
      toast({
        title: "Link público criado",
        description: "Qualquer pessoa com o link pode visualizar o documento.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!documentId) throw new Error("Documento inválido");
      await apiRequest("DELETE", `/api/documents/${documentId}/share`);
    },
    onSuccess: () => {
      setShareToken(null);
      onUpdate?.(null);
      toast({
        title: "Link revogado",
        description: "O documento não está mais acessível publicamente.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copiado!" });
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 size={18} className="text-primary" />
            Compartilhar documento
          </DialogTitle>
          <DialogDescription>
            "{documentTitle}" — gere um link público pra qualquer pessoa visualizar (somente leitura).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!shareToken ? (
            <div className="text-sm text-muted-foreground">
              Este documento ainda não tem link público. Clique em <strong>Criar link</strong> abaixo.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Link público</label>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    aria-label="Copiar link"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                ⚠️ Qualquer pessoa com este link pode ler o documento. Revogue se necessário.
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
          {shareToken && (
            <Button
              variant="outline"
              onClick={() => revokeMutation.mutate()}
              disabled={revokeMutation.isPending}
              className="text-destructive hover:text-destructive"
            >
              {revokeMutation.isPending ? (
                <Loader2 className="animate-spin mr-2" size={14} />
              ) : (
                <Trash2 className="mr-2" size={14} />
              )}
              Revogar link
            </Button>
          )}
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="animate-spin mr-2" size={14} />
              ) : (
                <Link2 className="mr-2" size={14} />
              )}
              {shareToken ? "Regenerar link" : "Criar link"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
