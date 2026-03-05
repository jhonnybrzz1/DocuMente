import { useState } from "react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Download, FileText, FileType, FileCode, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportMenuProps {
  documentId: number;
  documentTitle: string;
  onExportSuccess: () => void;
}

export default function ExportMenu({ documentId, documentTitle, onExportSuccess }: ExportMenuProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "word" | "markdown" | "text") => {
    setIsExporting(true);
    try {
      let url = "";
      let filename = "";

      switch (format) {
        case "word":
          url = `/api/documents/${documentId}/download`;
          filename = `${documentTitle}.docx`;
          break;
        case "markdown":
          url = `/api/documents/${documentId}/download/markdown`;
          filename = `${documentTitle}.md`;
          break;
        case "text":
          url = `/api/documents/${documentId}/download/text`;
          filename = `${documentTitle}.txt`;
          break;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("Documento vazio");
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Exportação bem-sucedida",
        description: `O documento foi exportado como ${format}.`,
        variant: "default",
      });

      onExportSuccess();
    } catch (error) {
      console.error(`Export ${format} error:`, error);
      toast({
        title: "Erro na exportação",
        description: error instanceof Error ? error.message : `Falha ao exportar como ${format}.`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-gray-600 p-1"
          title="Exportar documento"
          disabled={isExporting}
        >
          {isExporting ? (
            <span className="animate-pulse">Exportando...</span>
          ) : (
            <MoreHorizontal size={14} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport("word")}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>Exportar como Word (.docx)</span>
        </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("markdown")} disabled={isExporting}>
            <FileCode className="mr-2 h-4 w-4" />
            <span>Exportar como Markdown (.md)</span>
          </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("text")}
          className="cursor-pointer"
        >
          <FileType className="mr-2 h-4 w-4" />
          <span>Exportar como Texto (.txt)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}