import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

type TestCase = {
  id: string;
  type: "prd" | "userstories" | "techspec" | "apidoc";
  input: string;
  extractedText: string;
  requiredContains: string[];
  forbiddenContains: string[];
  criticalRules: string[];
  expectedSections: string[];
};

let activePort = 5000;

async function apiCall(endpoint: string, payload: Record<string, any>): Promise<any> {
  const response = await fetch(`http://127.0.0.1:${activePort}${endpoint}`, {
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
    const res = await fetch(`http://127.0.0.1:${port}/api/documents`);
    return res.ok || res.status === 401 || res.status === 400 || res.status === 404;
  } catch {
    return false;
  }
}

async function run() {
  console.log("=============================================================");
  console.log("Runner de Avaliação de Documentos (LLM-as-Judge + Determinístico)");
  console.log("=============================================================");

  const casesFile = path.resolve(process.cwd(), "evals/cases/document-generation.jsonl");
  if (!fs.existsSync(casesFile)) {
    console.error(`Erro: Arquivo de casos ${casesFile} não encontrado.`);
    process.exit(1);
  }

  // Ler casos de teste JSONL
  const casesContent = fs.readFileSync(casesFile, "utf-8");
  const testCases: TestCase[] = casesContent
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => JSON.parse(line));

  let serverProcess: any = null;

  // 1. Detectar porta ativa automaticamente
  if (await checkPortOnline(3000)) {
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
  let index = 0;
  const concurrencyLimit = 3;

  const worker = async () => {
    while (index < testCases.length) {
      const currentIndex = index++;
      const tc = testCases[currentIndex];
      
      console.log(`\n[worker] Iniciando Caso: ${tc.id} (${tc.type.toUpperCase()})`);
      const start = Date.now();
      let outputText = "";
      let documentId: number | undefined = undefined;

      try {
        const payload: Record<string, any> = {
          type: tc.type,
          title: `Caso de Teste - ${tc.id}`,
          demand: tc.input
        };
        if (tc.extractedText) {
          payload.extractedText = tc.extractedText;
        }

        const genRes = await apiCall("/api/generate-document", payload);
        outputText = genRes.content || "";
        documentId = genRes.id;

        const latency = Date.now() - start;
        console.log(`[worker] [${tc.id}] Documento gerado em ${latency}ms.`);

        // --- Checagens Determinísticas Sem LLM ---
        const checkResults: { name: string; passed: boolean; details?: string }[] = [];

        // 1. Ausência de placeholders
        const placeholderRegex = /\[\s*(Requisito|Preencher|Descrever|Inserir|Escrever|Placeholder|x|XXX|\.\.\.).*?\]/i;
        const hasPlaceholders = placeholderRegex.test(outputText) || /\[\.\.\.\]/.test(outputText);
        checkResults.push({
          name: "Ausência de Placeholders",
          passed: !hasPlaceholders,
          details: hasPlaceholders ? "Placeholders pendentes detectados no texto!" : "Nenhum placeholder detectado."
        });

        // 2. Presença de Seções Esperadas (flexível)
        const missingSections: string[] = [];
        for (const sec of tc.expectedSections) {
          const regex = new RegExp(`##\\s*(\\d+\\.\\s*)?${sec}`, "i");
          if (!regex.test(outputText) && !outputText.toLowerCase().includes(sec.toLowerCase())) {
            missingSections.push(sec);
          }
        }
        checkResults.push({
          name: "Estrutura e Seções Obrigatórias",
          passed: missingSections.length === 0,
          details: missingSections.length > 0 ? `Seções ausentes: ${missingSections.join(", ")}` : "Todas as seções obrigatórias presentes."
        });

        // 3. Regras Críticas / Substrings obrigatórias (requiredContains com suporte a &)
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
          details: missingContains.length > 0 ? `Requisitos não encontrados: [${missingContains.join(", ")}]` : "Todas as regras obrigatórias atendidas."
        });

        // 4. Substrings Proibidas (forbiddenContains com suporte a &)
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
          name: "Inexistência de Regras Proibidas (Forbidden)",
          passed: foundForbidden.length === 0,
          details: foundForbidden.length > 0 ? `Termos proibidos encontrados: [${foundForbidden.join(", ")}]` : "Nenhum termo proibido gerado."
        });

        // 5. Tamanho mínimo e máximo de output
        const isSizeOk = outputText.length >= 150 && outputText.length <= 40000;
        checkResults.push({
          name: "Limite de Tamanho do Output",
          passed: isSizeOk,
          details: `Tamanho: ${outputText.length} caracteres.`
        });

        const allDeterministicPassed = checkResults.every(c => c.passed);
        console.log(`[worker] [${tc.id}] ${checkResults.filter(c => c.passed).length}/${checkResults.length} checagens sem LLM passaram.`);

        // --- Avaliação do Juiz (LLM-as-Judge) ---
        console.log(`[worker] [${tc.id}] Avaliando documento via modelo juiz...`);
        const judgeRes = await apiCall("/api/ai/quality-score", {
          content: outputText,
          type: tc.type,
          documentId
        });

        console.log(`[worker] [${tc.id}] Score de Qualidade: ${judgeRes.overall}/100.`);

        const passed = allDeterministicPassed && !judgeRes.isReleaseBlocked;
        if (passed) successfulCases++;

        results.push({
          id: tc.id,
          type: tc.type,
          latencyMs: latency,
          passed,
          deterministicPassed: allDeterministicPassed,
          checks: checkResults,
          qualityScore: judgeRes.overall,
          dimensions: judgeRes.dimensions,
          isReleaseBlocked: judgeRes.isReleaseBlocked,
          blockers: judgeRes.blockers ?? [],
          suggestions: judgeRes.suggestions ?? [],
          outputText
        });

      } catch (caseErr: any) {
        console.error(`[worker] [erro] Falha ao executar caso ${tc.id}:`, caseErr.message);
        results.push({
          id: tc.id,
          type: tc.type,
          latencyMs: Date.now() - start,
          passed: false,
          deterministicPassed: false,
          checks: [],
          qualityScore: 0,
          dimensions: [],
          isReleaseBlocked: true,
          blockers: [`Erro na execução: ${caseErr.message}`],
          outputText: ""
        });
      }
    }
  };

  try {
    const workers = Array.from({ length: Math.min(concurrencyLimit, testCases.length) }, worker);
    await Promise.all(workers);
  } finally {
    if (serverProcess) {
      console.log("\n[server] Desligando servidor temporário...");
      serverProcess.kill();
    }
  }

  // Escrever o relatório consolidado
  const reportsDir = path.resolve(process.cwd(), "evals/reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Ordenar resultados pelo ID para manter relatório determinístico
  results.sort((a, b) => a.id.localeCompare(b.id));

  // Escrever JSON
  fs.writeFileSync(
    path.join(reportsDir, "latest.json"),
    JSON.stringify({ results, timestamp: new Date().toISOString() }, null, 2)
  );

  // Escrever Markdown
  const total = results.length;
  const successRate = (successfulCases / total) * 100;
  const latencies = results.map(r => r.latencyMs).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const scores = results.map(r => r.qualityScore);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const blockedCount = results.filter(r => r.isReleaseBlocked).length;

  let report = `# Relatório de Avaliação E2E - Geração de Documentos\n\n`;
  report += `*Executado em: ${new Date().toLocaleString()}*\n\n`;
  report += `## 📊 Métricas Consolidadas\n\n`;
  report += `| Métrica | Valor |\n`;
  report += `|---|---|\n`;
  report += `| **Total de Casos** | ${total} |\n`;
  report += `| **Taxa de Sucesso (Determinístico + Juiz)** | **${successRate.toFixed(1)}%** (${successfulCases}/${total}) |\n`;
  report += `| **Score Médio da Rubrica** | **${avgScore.toFixed(1)}/100** |\n`;
  report += `| **Latência p50** | ${p50}ms |\n`;
  report += `| **Latência p95** | ${p95}ms |\n`;
  report += `| **Documentos com Bloqueadores de Release** | ${blockedCount} |\n\n`;

  report += `## 🧪 Resumo por Caso de Teste\n\n`;
  report += `| Caso | Tipo | Latência | Score | Status | Bloqueado de Release |\n`;
  report += `|---|---|---|---|---|---|\n`;
  for (const r of results) {
    const status = r.passed ? "✅ PASSOU" : "❌ FALHOU";
    const blocked = r.isReleaseBlocked ? "Sim ⚠️" : "Não ✅";
    report += `| **${r.id}** | \`${r.type.toUpperCase()}\` | ${r.latencyMs}ms | ${r.qualityScore}/100 | ${status} | ${blocked} |\n`;
  }

  report += `\n## 🔍 Detalhes Individuais\n\n`;
  for (const r of results) {
    report += `### Caso: ${r.id}\n`;
    report += `- **Tipo**: \`${r.type.toUpperCase()}\`\n`;
    report += `- **Latência**: ${r.latencyMs}ms\n`;
    report += `- **Score da Rubrica**: ${r.qualityScore}/100\n`;
    report += `- **Release**: ${r.isReleaseBlocked ? "⚠️ BLOQUEADA" : "✅ LIBERADA"}\n\n`;

    report += `**Checagens Determinísticas (Sem LLM):**\n`;
    r.checks.forEach((c: any) => {
      report += `- [${c.passed ? "✅" : "❌"}] **${c.name}**: ${c.details}\n`;
    });
    report += `\n`;

    if (r.blockers.length > 0) {
      report += `**Bloqueadores Detectados:**\n`;
      r.blockers.forEach((b: string) => report += `- ❌ ${b}\n`);
      report += `\n`;
    }

    if (r.dimensions && r.dimensions.length > 0) {
      report += `**Notas Ponderadas da Rubrica (1 a 5):**\n`;
      r.dimensions.forEach((d: any) => {
        report += `- **${d.name}**: ${d.score / 20}/5 - *${d.feedback}*\n`;
      });
      report += `\n`;
    }

    report += `---\n\n`;
  }

  fs.writeFileSync(path.join(reportsDir, "latest.md"), report);

  console.log("\n=============================================================");
  console.log("Avaliação concluída!");
  console.log(`Relatório JSON: evals/reports/latest.json`);
  console.log(`Relatório MD: evals/reports/latest.md`);
  console.log(`Taxa de Sucesso Geral: ${successRate.toFixed(1)}%`);
  console.log("=============================================================");
}

run();
