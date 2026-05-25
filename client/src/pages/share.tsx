import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileText, Loader2, AlertCircle, Home } from "lucide-react";
import { documentTypes } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DOMPurify from "dompurify";
import { marked } from "marked";

interface SharedDocument {
  title: string;
  type: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function SharePage() {
  const [, params] = useRoute("/share/:token");
  const token = params?.token;

  const { data, isLoading, isError, error } = useQuery<SharedDocument>({
    queryKey: [`/api/share/${token}`],
    enabled: !!token,
  });

  const typeInfo = documentTypes.find((t) => t.value === data?.type);

  const renderedHtml = (() => {
    if (!data?.content) return "";
    try {
      const html = marked.parse(data.content, { breaks: true, gfm: true }) as string;
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          "p", "br", "h1", "h2", "h3", "h4", "h5", "h6",
          "strong", "em", "b", "i", "u", "code", "pre",
          "ul", "ol", "li", "blockquote", "hr",
          "table", "thead", "tbody", "tr", "th", "td",
          "a", "span", "div",
        ],
        ALLOWED_ATTR: ["class", "href", "target", "rel"],
      });
    } catch {
      return DOMPurify.sanitize(data.content);
    }
  })();

  return (
    <div className="min-h-dvh bg-background">
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="text-white" size={16} />
              </div>
              <span className="font-semibold">DocuMente</span>
              <Badge variant="outline" className="ml-2 text-xs">Documento compartilhado</Badge>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="mr-2" size={14} />
                Ir para o app
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}

        {isError && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6 text-center space-y-3">
              <AlertCircle className="mx-auto text-destructive" size={48} />
              <h2 className="text-xl font-semibold">Documento não encontrado</h2>
              <p className="text-muted-foreground">
                O link pode ter expirado, sido revogado ou estar incorreto.
              </p>
              <p className="text-xs text-muted-foreground">
                {error instanceof Error ? error.message : ""}
              </p>
            </CardContent>
          </Card>
        )}

        {data && (
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {typeInfo && (
                      <Badge variant="secondary" className="text-xs">
                        {typeInfo.label}
                      </Badge>
                    )}
                    {data.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="text-2xl">{data.title}</CardTitle>
                </div>
                <div className="text-xs text-muted-foreground sm:text-right">
                  Criado em{" "}
                  {format(new Date(data.createdAt), "d 'de' MMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                  {data.updatedAt && data.updatedAt !== data.createdAt && (
                    <>
                      <br />
                      Atualizado em{" "}
                      {format(new Date(data.updatedAt), "d 'de' MMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div
                className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-muted-foreground mt-8">
          Documento gerado com{" "}
          <Link href="/">
            <span className="text-primary hover:underline cursor-pointer">DocuMente</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
