import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, TrendingUp, Calendar, Share2, Hash, Clock, DollarSign, Activity, Cpu, type LucideIcon } from "lucide-react";
import { documentTypes } from "@shared/schema";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

interface DocumentStats {
  total: number;
  byType: Record<string, number>;
  byMonth: Array<{ month: string; count: number }>;
  thisWeek: number;
  thisMonth: number;
  shared: number;
  averageContentLength: number;
  topTags: Array<{ tag: string; count: number }>;
}

const COLORS = [
  "#3b82f6", // blue
  "#a855f7", // purple
  "#22c55e", // green
  "#f97316", // orange
  "#6366f1", // indigo
  "#ef4444", // red
  "#6b7280", // gray
  "#eab308", // yellow
  "#14b8a6", // teal
];

// Estima tempo economizado: assume que cada documento economizou ~30min de redação manual
const TIME_SAVED_PER_DOC_MIN = 30;

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-3xl font-bold mt-1">{value}</div>
            {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="text-primary" size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export default function StatsPage() {
  const { data, isLoading } = useQuery<DocumentStats>({
    queryKey: ["/api/stats"],
  });

  const { data: costData } = useQuery<{
    summary: {
      totalCostUsd: number;
      totalTokens: number;
      promptTokens: number;
      completionTokens: number;
      totalRequests: number;
      successCount: number;
      failureCount: number;
      averageLatencyMs: number;
    };
    byModel: Record<string, { costUsd: number; count: number; tokens: number }>;
    byTask: Record<string, { costUsd: number; count: number; tokens: number }>;
    dailyCost: Array<{ date: string; cost: number }>;
  }>({
    queryKey: ["/api/ai/cost-summary"],
  });

  const typeChartData = data
    ? Object.entries(data.byType).map(([type, count]) => ({
        name: documentTypes.find((t) => t.value === type)?.label ?? type,
        value: count,
      }))
    : [];

  const timeSavedMin = (data?.total ?? 0) * TIME_SAVED_PER_DOC_MIN;

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="text-primary" />
            Estatísticas
          </h1>
          <p className="text-muted-foreground mt-1">
            Métricas de uso, produção de documentos e tempo economizado.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}

        {data && data.total === 0 && (
          <Card>
            <CardContent className="text-center py-16">
              <FileText className="mx-auto text-muted-foreground mb-3" size={48} />
              <h2 className="text-xl font-semibold">Sem dados ainda</h2>
              <p className="text-muted-foreground mt-1">
                Comece criando seu primeiro documento.
              </p>
            </CardContent>
          </Card>
        )}

        {data && data.total > 0 && (
          <>
            {/* Cards de KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={FileText}
                label="Total de documentos"
                value={data.total}
              />
              <StatCard
                icon={Calendar}
                label="Esta semana"
                value={data.thisWeek}
                hint={`${data.thisMonth} no último mês`}
              />
              <StatCard
                icon={Share2}
                label="Compartilhados"
                value={data.shared}
                hint="com link público ativo"
              />
              <StatCard
                icon={Clock}
                label="Tempo economizado"
                value={formatDuration(timeSavedMin)}
                hint={`~${TIME_SAVED_PER_DOC_MIN}min por documento`}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Distribuição por tipo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição por tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  {typeChartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={typeChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) => `${entry.name} (${entry.value})`}
                        >
                          {typeChartData.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Evolução mensal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documentos por mês</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.byMonth.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={data.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top tags + Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash size={18} /> Top tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.topTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Adicione tags aos seus documentos pra ver as mais usadas aqui.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={Math.max(80, data.topTags.length * 35)}>
                      <BarChart
                        data={data.topTags}
                        layout="vertical"
                        margin={{ left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                        <YAxis dataKey="tag" type="category" tick={{ fontSize: 12 }} width={100} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tipo mais produzido
                    </span>
                    <Badge variant="secondary">
                      {typeChartData.reduce(
                        (max, t) => (t.value > (max?.value ?? 0) ? t : max),
                        typeChartData[0]
                      )?.name ?? "—"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tamanho médio
                    </span>
                    <Badge variant="secondary">
                      {Math.round(data.averageContentLength / 1000)}k caracteres
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      % com link público
                    </span>
                    <Badge variant="secondary">
                      {data.total > 0
                        ? `${Math.round((data.shared / data.total) * 100)}%`
                        : "0%"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Frequência semanal
                    </span>
                    <Badge variant="secondary">
                      ~{(data.thisMonth / 4).toFixed(1)} docs/sem
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Telemetria e Gastos com IA */}
            {costData && costData.summary && costData.summary.totalRequests > 0 && (
              <div className="mt-8 mb-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <DollarSign className="text-primary" />
                  Telemetria e Gastos com IA
                </h2>
                
                {/* Cards de KPIs de Custo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <StatCard
                    icon={DollarSign}
                    label="Custo Total (IA)"
                    value={`$${costData.summary.totalCostUsd.toFixed(4)}`}
                    hint="estimativa com base em tokens"
                  />
                  <StatCard
                    icon={Activity}
                    label="Requisições IA"
                    value={`${costData.summary.totalRequests} chamadas`}
                    hint={`${costData.summary.successCount} OK / ${costData.summary.failureCount} falhas`}
                  />
                  <StatCard
                    icon={Cpu}
                    label="Total de Tokens"
                    value={costData.summary.totalTokens.toLocaleString()}
                    hint={`P: ${costData.summary.promptTokens.toLocaleString()} / C: ${costData.summary.completionTokens.toLocaleString()}`}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Gráfico de Evolução Diária */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Evolução diária dos custos (USD)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {costData.dailyCost.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sem dados históricos</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={costData.dailyCost}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value: number) => [`$${value.toFixed(5)}`, 'Custo']} />
                            <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Detalhamento por Modelo */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Custo por Modelo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(costData.byModel).map(([model, metrics]) => (
                        <div key={model} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="text-sm font-medium truncate max-w-[180px]">{model}</p>
                            <p className="text-xs text-muted-foreground">{metrics.count} chamadas</p>
                          </div>
                          <Badge variant="secondary" className="font-mono">
                            ${metrics.costUsd.toFixed(4)}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
