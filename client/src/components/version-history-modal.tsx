import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Clock, Eye, RotateCcw, X, GitCompare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DocumentVersion as DocumentVersionType } from "@shared/schema";

// Permite tanto o tipo do schema quanto o legado (string-based id)
interface VersionDisplay {
  id: number | string;
  version: number;
  content: string;
  createdAt: Date | string;
  changeDescription?: string | null;
  createdBy?: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (version: VersionDisplay) => void;
  documentId: number | null;
  documentTitle: string;
  versions: (VersionDisplay | DocumentVersionType)[];
}

// Calcula um diff line-by-line simples (LCS-based) sem dependência externa
function computeLineDiff(oldText: string, newText: string) {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  // LCS table
  const m = oldLines.length;
  const n = newLines.length;
  const lcs: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  // Backtrack
  const diff: Array<{ type: "same" | "added" | "removed"; line: string }> = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (oldLines[i - 1] === newLines[j - 1]) {
      diff.unshift({ type: "same", line: oldLines[i - 1] });
      i--;
      j--;
    } else if (lcs[i - 1][j] >= lcs[i][j - 1]) {
      diff.unshift({ type: "removed", line: oldLines[i - 1] });
      i--;
    } else {
      diff.unshift({ type: "added", line: newLines[j - 1] });
      j--;
    }
  }
  while (i > 0) {
    diff.unshift({ type: "removed", line: oldLines[i - 1] });
    i--;
  }
  while (j > 0) {
    diff.unshift({ type: "added", line: newLines[j - 1] });
    j--;
  }

  return diff;
}

export default function VersionHistoryModal({
  isOpen,
  onClose,
  onRestore,
  documentTitle,
  versions,
}: VersionHistoryModalProps) {
  const [selectedVersion, setSelectedVersion] = useState<VersionDisplay | null>(null);
  const [compareWith, setCompareWith] = useState<VersionDisplay | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "diff">("preview");

  const sortedVersions = useMemo(
    () =>
      [...versions].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ) as VersionDisplay[],
    [versions]
  );

  const handleRestore = async () => {
    if (!selectedVersion) return;
    setIsRestoring(true);
    try {
      await onRestore(selectedVersion);
      onClose();
    } catch (error) {
      console.error("Failed to restore version:", error);
    } finally {
      setIsRestoring(false);
    }
  };

  const diff = useMemo(() => {
    if (!selectedVersion || !compareWith) return null;
    return computeLineDiff(compareWith.content, selectedVersion.content);
  }, [selectedVersion, compareWith]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="text-primary" size={20} />
            <span>Histórico de Versões: {documentTitle}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {sortedVersions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum histórico de versões disponível.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                As versões são criadas automaticamente quando você edita o documento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Lista de versões */}
              <div className="space-y-2 lg:col-span-1 max-h-[60vh] overflow-y-auto pr-2">
                {sortedVersions.map((version) => (
                  <Card
                    key={String(version.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedVersion?.id === version.id
                        ? "border-primary bg-accent"
                        : "border-input hover:bg-accent/50"
                    }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          Versão {version.version}
                        </CardTitle>
                        <Badge
                          variant={version.version === 1 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {version.version === 1 ? "Original" : `v${version.version}`}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        {formatDistanceToNow(new Date(version.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                      {version.changeDescription && (
                        <p className="text-xs line-clamp-2">
                          {version.changeDescription}
                        </p>
                      )}
                      {selectedVersion?.id !== version.id && sortedVersions.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCompareWith(version);
                            setViewMode("diff");
                          }}
                          className="text-xs text-primary hover:underline mt-1 flex items-center gap-1"
                        >
                          <GitCompare size={10} />
                          Comparar
                        </button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Painel de visualização */}
              <div className="lg:col-span-2 min-h-[60vh] border rounded-lg p-4 bg-muted/20">
                {!selectedVersion ? (
                  <div className="text-center text-muted-foreground py-12">
                    <Eye className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-sm">Selecione uma versão à esquerda</p>
                  </div>
                ) : (
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Eye size={16} />
                        Versão {selectedVersion.version}
                      </h4>
                      <TabsList>
                        <TabsTrigger value="preview" className="text-xs">
                          Conteúdo
                        </TabsTrigger>
                        <TabsTrigger
                          value="diff"
                          className="text-xs"
                          disabled={!compareWith}
                        >
                          <GitCompare size={12} className="mr-1" />
                          Diff
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="preview">
                      <pre className="whitespace-pre-wrap text-xs font-mono bg-background p-3 rounded max-h-[50vh] overflow-y-auto border">
                        {selectedVersion.content}
                      </pre>
                    </TabsContent>

                    <TabsContent value="diff">
                      {compareWith ? (
                        <div>
                          <div className="text-xs text-muted-foreground mb-2">
                            Comparando v{compareWith.version} (base) → v{selectedVersion.version}
                          </div>
                          <div className="font-mono text-xs bg-background p-3 rounded max-h-[50vh] overflow-y-auto border">
                            {diff?.map((d, i) => (
                              <div
                                key={i}
                                className={
                                  d.type === "added"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                    : d.type === "removed"
                                    ? "bg-red-500/10 text-red-700 dark:text-red-400 line-through opacity-70"
                                    : "text-muted-foreground"
                                }
                              >
                                <span className="select-none mr-2 opacity-60">
                                  {d.type === "added" ? "+" : d.type === "removed" ? "−" : " "}
                                </span>
                                {d.line || "\u00A0"}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Selecione "Comparar" em outra versão pra ver o diff.
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isRestoring}
          >
            <X className="mr-2" size={16} />
            Fechar
          </Button>

          <Button
            onClick={handleRestore}
            disabled={
              !selectedVersion ||
              isRestoring ||
              (sortedVersions.length > 0 && selectedVersion.id === sortedVersions[0].id)
            }
          >
            {isRestoring ? (
              <span className="animate-pulse">Restaurando...</span>
            ) : (
              <>
                <RotateCcw className="mr-2" size={16} />
                Restaurar Esta Versão
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
