import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Github, CheckSquare, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface IntegrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number;
  documentTitle: string;
  documentType: string;
}

export default function IntegrationDialog({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  documentType,
}: IntegrationDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"github" | "jira">("github");
  const [isLoading, setIsLoading] = useState(false);
  const [successLink, setSuccessLink] = useState<string | null>(null);

  // GitHub States
  const [ghRepo, setGhRepo] = useState("");
  const [ghToken, setGhToken] = useState("");

  // Jira States
  const [jiraDomain, setJiraDomain] = useState("");
  const [jiraProject, setJiraProject] = useState("");
  const [jiraEmail, setJiraEmail] = useState("jose.jonathan@unifesp.br"); // Email padrão das memórias
  const [jiraToken, setJiraToken] = useState("");
  const [jiraIssueType, setJiraIssueType] = useState("Task");

  // Carregar dados salvos do localStorage ao abrir
  useEffect(() => {
    if (isOpen) {
      setSuccessLink(null);
      setGhRepo(localStorage.getItem("docu_gh_repo") || "");
      setGhToken(localStorage.getItem("docu_gh_token") || "");
      setJiraDomain(localStorage.getItem("docu_jira_domain") || "");
      setJiraProject(localStorage.getItem("docu_jira_project") || "");
      setJiraEmail(localStorage.getItem("docu_jira_email") || "jose.jonathan@unifesp.br");
      setJiraToken(localStorage.getItem("docu_jira_token") || "");
      
      // Auto selecionar tipo de issue padrão baseado no tipo do documento
      if (documentType === "epic") {
        setJiraIssueType("Epic");
      } else if (documentType === "userstories") {
        setJiraIssueType("Story");
      } else {
        setJiraIssueType("Task");
      }
    }
  }, [isOpen, documentType]);

  // Salva credenciais em tempo real no localStorage para persistência imediata
  useEffect(() => {
    if (ghRepo) localStorage.setItem("docu_gh_repo", ghRepo.trim());
  }, [ghRepo]);

  useEffect(() => {
    if (ghToken) localStorage.setItem("docu_gh_token", ghToken.trim());
  }, [ghToken]);

  useEffect(() => {
    if (jiraDomain) localStorage.setItem("docu_jira_domain", jiraDomain.trim());
  }, [jiraDomain]);

  useEffect(() => {
    if (jiraProject) localStorage.setItem("docu_jira_project", jiraProject.trim());
  }, [jiraProject]);

  useEffect(() => {
    if (jiraEmail) localStorage.setItem("docu_jira_email", jiraEmail.trim());
  }, [jiraEmail]);

  useEffect(() => {
    if (jiraToken) localStorage.setItem("docu_jira_token", jiraToken.trim());
  }, [jiraToken]);

  const handleGithubPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghRepo.trim() || !ghToken.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o repositório e o token do GitHub.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSuccessLink(null);

    // Salva configurações de conveniência no localStorage
    localStorage.setItem("docu_gh_repo", ghRepo.trim());
    localStorage.setItem("docu_gh_token", ghToken.trim());

    try {
      const res = await apiRequest("POST", `/api/documents/${documentId}/push/github`, {
        repo: ghRepo.trim(),
        token: ghToken.trim(),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Erro desconhecido ao exportar para o GitHub.");
      }

      const data = await res.json() as { success: boolean; url: string; number: number };
      setSuccessLink(data.url);
      toast({
        title: "Exportado com sucesso!",
        description: `Issue #${data.number} criada no GitHub.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Falha na exportação",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao criar a issue no GitHub.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJiraPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jiraDomain.trim() || !jiraProject.trim() || !jiraEmail.trim() || !jiraToken.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do Jira.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSuccessLink(null);

    // Salva configurações de conveniência no localStorage
    localStorage.setItem("docu_jira_domain", jiraDomain.trim());
    localStorage.setItem("docu_jira_project", jiraProject.trim());
    localStorage.setItem("docu_jira_email", jiraEmail.trim());
    localStorage.setItem("docu_jira_token", jiraToken.trim());

    try {
      const res = await apiRequest("POST", `/api/documents/${documentId}/push/jira`, {
        domain: jiraDomain.trim(),
        projectKey: jiraProject.trim().toUpperCase(),
        email: jiraEmail.trim(),
        apiToken: jiraToken.trim(),
        issueType: jiraIssueType,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Erro desconhecido ao exportar para o Jira.");
      }

      const data = await res.json() as { success: boolean; key: string; url: string };
      setSuccessLink(data.url);
      toast({
        title: "Exportado com sucesso!",
        description: `Item ${data.key} criado no Jira.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Falha na exportação",
        description: err instanceof Error ? err.message : "Ocorreu um erro ao criar o item no Jira.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Integrações de Entrega</DialogTitle>
          <DialogDescription>
            Envie este documento diretamente para o seu quadro de tarefas do Jira ou repositório do GitHub.
          </DialogDescription>
        </DialogHeader>

        {successLink ? (
          <div className="py-6 text-center space-y-4">
            <div className="text-4xl text-green-500">🎉</div>
            <h3 className="font-semibold text-lg text-foreground">Documento Exportado!</h3>
            <p className="text-sm text-muted-foreground">
              Sua tarefa/issue foi criada com sucesso na plataforma externa.
            </p>
            <Button asChild variant="default" className="mt-2">
              <a href={successLink} target="_blank" rel="noopener noreferrer" className="flex items-center">
                Visualizar no {activeTab === "github" ? "GitHub" : "Jira"}
                <ExternalLink className="ml-2" size={14} />
              </a>
            </Button>
            <div className="pt-4">
              <Button variant="outline" onClick={() => setSuccessLink(null)}>
                Exportar Novamente
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="github" className="flex items-center">
                <Github size={16} className="mr-2" />
                GitHub
              </TabsTrigger>
              <TabsTrigger value="jira" className="flex items-center">
                <CheckSquare size={16} className="mr-2" />
                Jira Cloud
              </TabsTrigger>
            </TabsList>

            <TabsContent value="github">
              <form onSubmit={handleGithubPush} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gh-repo">Repositório (owner/name)</Label>
                  <Input
                    id="gh-repo"
                    placeholder="Ex: jhonnybrzz1/DocuMente"
                    value={ghRepo}
                    onChange={(e) => setGhRepo(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gh-token">Personal Access Token (PAT)</Label>
                  <Input
                    id="gh-token"
                    type="password"
                    placeholder="ghp_..."
                    value={ghToken}
                    onChange={(e) => setGhToken(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Gere o token com escopo 'repo' nas configurações de desenvolvedor do seu GitHub.
                  </p>
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Github size={16} className="mr-2" />}
                    Criar Issue no GitHub
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="jira">
              <form onSubmit={handleJiraPush} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="jira-domain">Domínio do Jira Cloud</Label>
                  <Input
                    id="jira-domain"
                    placeholder="Ex: sua-empresa.atlassian.net"
                    value={jiraDomain}
                    onChange={(e) => setJiraDomain(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="jira-project">Chave do Projeto</Label>
                    <Input
                      id="jira-project"
                      placeholder="Ex: PROJ"
                      value={jiraProject}
                      onChange={(e) => setJiraProject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="jira-issuetype">Tipo de Issue</Label>
                    <Select value={jiraIssueType} onValueChange={setJiraIssueType}>
                      <SelectTrigger id="jira-issuetype">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Epic">Epic (Épico)</SelectItem>
                        <SelectItem value="Story">Story (História)</SelectItem>
                        <SelectItem value="Task">Task (Tarefa)</SelectItem>
                        <SelectItem value="Bug">Bug (Erro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jira-email">E-mail da Conta Atlassian</Label>
                  <Input
                    id="jira-email"
                    type="email"
                    placeholder="Ex: jose.jonathan@unifesp.br"
                    value={jiraEmail}
                    onChange={(e) => setJiraEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jira-token">API Token do Jira</Label>
                  <Input
                    id="jira-token"
                    type="password"
                    placeholder="Insira seu Atlassian API Token..."
                    value={jiraToken}
                    onChange={(e) => setJiraToken(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Gere o token em id.atlassian.com/manage-profile/security/api-tokens.
                  </p>
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckSquare size={16} className="mr-2" />}
                    Enviar para o Jira
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
