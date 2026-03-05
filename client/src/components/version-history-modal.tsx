import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, Eye, RotateCcw, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DocumentVersion {
  id: string;
  version: number;
  content: string;
  createdAt: Date;
  createdBy: string;
  changeDescription: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (version: DocumentVersion) => void;
  documentId: number | null;
  documentTitle: string;
  versions: DocumentVersion[];
}

export default function VersionHistoryModal({
  isOpen,
  onClose,
  onRestore,
  documentId,
  documentTitle,
  versions,
}: VersionHistoryModalProps) {
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const sortedVersions = [...versions].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="text-primary" size={20} />
            <span>Histórico de Versões: {documentTitle}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {sortedVersions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum histórico de versões disponível para este documento.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedVersions.map((version) => (
                <Card
                  key={version.id}
                  className={`cursor-pointer transition-colors ${
                    selectedVersion?.id === version.id
                      ? "border-primary bg-accent"
                      : "border-input hover:bg-accent"
                  }`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Versão {version.version}
                      </CardTitle>
                      <Badge variant={version.version === 1 ? "default" : "secondary"}>
                        {version.version === 1 ? "Original" : `v${version.version}`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(version.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                      {version.changeDescription && (
                        <p className="text-sm">
                          <strong>Alteração:</strong> {version.changeDescription}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        <strong>Por:</strong> {version.createdBy}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedVersion && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-medium mb-2 flex items-center">
                <Eye className="mr-2" size={16} />
                Preview da Versão {selectedVersion.version}:
              </h4>
              <div className="bg-muted p-4 rounded-lg text-sm font-mono max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{selectedVersion.content}</pre>
              </div>

              <DialogFooter className="mt-4 flex items-center justify-between">
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
                  disabled={isRestoring || selectedVersion.version === 1}
                >
                  {isRestoring ? (
                    <>
                      <span className="animate-pulse">Restaurando...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2" size={16} />
                      Restaurar Esta Versão
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}