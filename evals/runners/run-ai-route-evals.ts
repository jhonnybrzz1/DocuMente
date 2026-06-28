import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

type QuickActionCase = {
  id: string;
  action: string;
  text: string;
  requiredContains: string[];
  forbiddenContains: string[];
  criticalRules: string[];
};

type ChatCase = {
  id: string;
  documentType: string;
  documentContent: string;
  message: string;
  requiredContains: string[];
  forbiddenContains: string[];
  criticalRules: string[];
};

let activePort = 5000;

async function apiCall(endpoint: string, payload: Record<string, any>): Promise<any> {
  const response = await fetch(`http://localhost:${activePort}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function checkPortOnline(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${port}/api/documents`);
    return res.ok || res.status === 401 || res.status === 400 || res.status === 404;
  } catch {
    return false;
  }
}

async function run() {
  console.log("=============================================================");
  console.log("Runner de Avaliação de Rotas de IA (Quick Actions & Chat)");
  console.log("=============================================================");

  const qaFile = path.resolve(process.cwd(), "evals/cases/quick-actions.jsonl");
  const chatFile = path.resolve(process.cwd(), "evals/cases/chat-refinement.jsonl");

  let qaCases: QuickActionCase[] = [];
  if (fs.existsSync(qaFile)) {
    qaCases = fs.readFileSync(qaFile, "utf-8")
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => JSON.parse(line));
  }

  let chatCases: ChatCase[] = [];
  if (fs.existsSync(chatFile)) {
    chatCases = fs.readFileSync(chatFile, "utf-8")
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => JSON.parse(line));
  }

  let serverProcess: any = null;

  // 1. Detectar porta ativa automaticamente
  if (await checkPortOnline(5000)) {
    console.log("[server] Utilizando servidor existente na porta 5000.");
    activePort = 5000;
  } else if (await checkPortOnline(5001)) {
    console.log("[server] Utilizando servidor existente na porta 5001.");
    activePort = 5001;
  } else if (await checkPortOnline(3000)) {
    console.log("[server] Utilizando servidor existente na porta 3000.");
    activePort = 3000;
  } else {
    console.log("[server] Inicializando servidor temporário na porta 5099...");
    activePort = 5099;
    const serverEnv = { ...process.env, PORT: "5099", NODE_ENV: "development" };
    serverProcess = spawn("npx", ["tsx", "server/index.ts"], { env: serverEnv });
    
    serverProcess.stderr.on("data", (data: any) => console.error(`[server-err] ${data}`));
    await new Promise((resolve) => setTimeout(resolve, 3500));
    console.log("[server] Servidor temporário online.");
  }

  const results: any[] = [];
  let successfulCases = 0;

  // Função para processar uma Quick Action em paralelo
  const processQuickAction = async (tc: QuickActionCase) => {
    console.log(`\n[worker] Iniciando Quick Action: ${tc.id}`);
    const start = Date.now();
    try {
      const res = await apiCall("/api/ai/quick-action", {
        action: tc.action,
        text: tc.text
      });
      const outputText = res.result || "";
      const latency = Date.now() - start;

      const checkResults: { name: string; passed: boolean; details?: string }[] = [];

      // Validar requiredContains
      const missingContains: string[] = [];
      for (const req of tc.requiredContains) {
        if (req.includes("&")) {
          const parts = req.split("&").map(p => p.trim());
          const allPartsPassed = parts.every(part => {
            const regex = new RegExp(part, "i");
            return regex.test(outputText);
          });
          if (!allPartsPassed) {
            missingContains.push(req);
          }
        } else {
          const regex = new RegExp(req, "i");
          if (!regex.test(outputText)) {
            missingContains.push(req);
          }
        }
      }
      checkResults.push({
        name: "Preservação de Regras Críticas (Required)",
        passed: missingContains.length === 0,
        details: missingContains.length > 0 ? `Requisitos ausentes: [${missingContains.join(", ")}]` : "Todas as regras requeridas estão presentes."
      });

      // Validar forbiddenContains
      const foundForbidden: string[] = [];
      for (const forb of tc.forbiddenContains) {
        if (forb.includes("&")) {
          const parts = forb.split("&").map(p => p.trim());
          const allPartsPresent = parts.every(part => {
            const regex = new RegExp(part, "i");
            return regex.test(outputText);
          });
          if (allPartsPresent) {
            foundForbidden.push(forb);
          }
        } else {
          const regex = new RegExp(forb, "i");
          if (regex.test(outputText)) {
            foundForbidden.push(forb);
          }
        }
      }
      checkResults.push({
        name: "Ausência de Termos Proibidos (Forbidden)",
        passed: foundForbidden.length === 0,
        details: foundForbidden.length > 0 ? `Termos proibidos encontrados: [${foundForbidden.join(", ")}]` : "Nenhum termo proibido gerado."
      });

      const passed = checkResults.every(c => c.passed);
      if (passed) successfulCases++;

      console.log(`[worker] [${tc.id}] Latência: ${latency}ms. Status: ${passed ? "PASSOU ✅" : "FALHOU ❌"}`);

      results.push({
        id: tc.id,
        routeType: "quick-action",
        latencyMs: latency,
        passed,
        checks: checkResults,
        outputText
      });

    } catch (err: any) {
      console.error(`[worker] [erro] Falha ao rodar quick action ${tc.id}:`, err.message);
      results.push({
        id: tc.id,
        routeType: "quick-action",
        latencyMs: Date.now() - start,
        passed: false,
        checks: [],
        outputText: ""
      });
    }
  };

  // Função para processar um Chat Refinement em paralelo
  const processChatRefinement = async (tc: ChatCase) => {
    console.log(`\n[worker] Iniciando Chat Refinement: ${tc.id}`);
    const start = Date.now();
    try {
      const res = await apiCall("/api/ai/chat", {
        documentType: tc.documentType,
        documentContent: tc.documentContent,
        messages: [{ role: "user", content: tc.message }]
      });
      const outputText = res.response || "";
      const latency = Date.now() - start;

      const checkResults: { name: string; passed: boolean; details?: string }[] = [];

      // Validar requiredContains
      const missingContains: string[] = [];
      for (const req of tc.requiredContains) {
        if (req.includes("&")) {
          const parts = req.split("&").map(p => p.trim());
          const allPartsPassed = parts.every(part => {
            const regex = new RegExp(part, "i");
            return regex.test(outputText);
          });
          if (!allPartsPassed) {
            missingContains.push(req);
          }
        } else {
          const regex = new RegExp(req, "i");
          if (!regex.test(outputText)) {
            missingContains.push(req);
          }
        }
      }
      checkResults.push({
        name: "Explicação/Esclarecimento de Ambiguidade (Required)",
        passed: missingContains.length === 0,
        details: missingContains.length > 0 ? `Resposta não contém explicação de ambiguidade.` : "Explicação/esclarecimento correto de ambiguidade presente."
      });

      // Validar forbiddenContains
      const foundForbidden: string[] = [];
      for (const forb of tc.forbiddenContains) {
        if (forb.includes("&")) {
          const parts = forb.split("&").map(p => p.trim());
          const allPartsPresent = parts.every(part => {
            const regex = new RegExp(part, "i");
            return regex.test(outputText);
          });
          if (allPartsPresent) {
            foundForbidden.push(forb);
          }
        } else {
          const regex = new RegExp(forb, "i");
          if (regex.test(outputText)) {
            foundForbidden.push(forb);
          }
        }
      }
      checkResults.push({
        name: "Prevenção de Inclusão Indevida (Forbidden)",
        passed: foundForbidden.length === 0,
        details: foundForbidden.length > 0 ? `Termos proibidos encontrados na resposta: [${foundForbidden.join(", ")}]` : "Nenhum termo proibido foi incluído incorretamente."
      });

      const passed = checkResults.every(c => c.passed);
      if (passed) successfulCases++;

      console.log(`[worker] [${tc.id}] Latência: ${latency}ms. Status: ${passed ? "PASSOU ✅" : "FALHOU ❌"}`);

      results.push({
        id: tc.id,
        routeType: "chat-refinement",
        latencyMs: latency,
        passed,
        checks: checkResults,
        outputText
      });

    } catch (err: any) {
      console.error(`[worker] [erro] Falha ao rodar chat ${tc.id}:`, err.message);
      results.push({
        id: tc.id,
        routeType: "chat-refinement",
        latencyMs: Date.now() - start,
        passed: false,
        checks: [],
        outputText: ""
      });
    }
  };

  // Executar todas as promessas concorrentemente
  try {
    const promises = [
      ...qaCases.map(processQuickAction),
      ...chatCases.map(processChatRefinement)
    ];
    await Promise.all(promises);
  } finally {
    if (serverProcess) {
      console.log("\n[server] Desligando servidor temporário...");
      serverProcess.kill();
    }
  }

  // Gravar relatórios de rotas
  const reportsDir = path.resolve(process.cwd(), "evals/reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Ordenar resultados para manter relatório determinístico
  results.sort((a, b) => a.id.localeCompare(b.id));

  fs.writeFileSync(
    path.join(reportsDir, "routes.json"),
    JSON.stringify({ results, timestamp: new Date().toISOString() }, null, 2)
  );

  const total = results.length;
  const successRate = total > 0 ? (successfulCases / total) * 100 : 0;
  const latencies = results.map(r => r.latencyMs).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;

  let report = `# Relatório de Avaliação E2E - Rotas Auxiliares de IA\n\n`;
  report += `*Executado em: ${new Date().toLocaleString()}*\n\n`;
  report += `## 📊 Métricas das Rotas\n\n`;
  report += `| Métrica | Valor |\n`;
  report += `|---|---|\n`;
  report += `| **Total de Cenários** | ${total} |\n`;
  report += `| **Taxa de Sucesso (Checks Determinísticos)** | **${successRate.toFixed(1)}%** (${successfulCases}/${total}) |\n`;
  report += `| **Latência p50** | ${p50}ms |\n`;
  report += `| **Latência p95** | ${p95}ms |\n\n`;

  report += `## 🧪 Resumo por Cenário\n\n`;
  report += `| Cenário | Tipo | Latência | Status |\n`;
  report += `|---|---|---|---|\n`;
  for (const r of results) {
    const status = r.passed ? "✅ PASSOU" : "❌ FALHOU";
    report += `| **${r.id}** | \`${r.routeType.toUpperCase()}\` | ${r.latencyMs}ms | ${status} |\n`;
  }

  report += `\n## 🔍 Detalhes Individuais\n\n`;
  for (const r of results) {
    report += `### Cenário: ${r.id}\n`;
    report += `- **Tipo**: \`${r.routeType.toUpperCase()}\`\n`;
    report += `- **Latência**: ${r.latencyMs}ms\n`;
    report += `- **Resultado Final**: ${r.passed ? "✅ PASSOU" : "❌ FALHOU"}\n\n`;

    report += `**Checagens Determinísticas executadas:**\n`;
    r.checks.forEach((c: any) => {
      report += `- [${c.passed ? "✅" : "❌"}] **${c.name}**: ${c.details}\n`;
    });
    report += `\n`;
    report += `---\n\n`;
  }

  fs.writeFileSync(path.join(reportsDir, "routes.md"), report);

  console.log("\n=============================================================");
  console.log("Avaliação das Rotas de IA concluída com sucesso!");
  console.log(`Relatório JSON: evals/reports/routes.json`);
  console.log(`Relatório MD: evals/reports/routes.md`);
  console.log(`Taxa de Sucesso Geral: ${successRate.toFixed(1)}%`);
  console.log("=============================================================");
}

run();
