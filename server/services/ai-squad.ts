import { logger } from "../utils/logger";
import * as fs from "fs";
import * as path from "path";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AgentResponse {
  content: string;
  score: number;
  failures?: string[];
  analysis?: string;
  status?: string;
}

export interface Agent {
  run: (messages: ChatMessage[]) => Promise<AgentResponse>;
}

/**
 * Valida a resposta do agente contra os critérios do Context Handshake.
 * Critérios:
 * 1. O score deve ser >= 50.
 * 2. Os campos obrigatórios estruturais ('analysis' e 'status') devem estar presentes e não vazios.
 */
export function validateResponse(response: AgentResponse): { isValid: boolean; failures: string[] } {
  const failures: string[] = [];

  if (response.score === undefined || response.score === null) {
    failures.push("Missing required field: score");
  } else if (response.score < 50) {
    failures.push(`Score ${response.score} is below the minimum threshold of 50`);
  }

  if (!response.analysis || typeof response.analysis !== "string" || response.analysis.trim() === "") {
    failures.push("Missing required field: analysis");
  }

  if (!response.status || typeof response.status !== "string" || response.status.trim() === "") {
    failures.push("Missing required field: status");
  }

  return {
    isValid: failures.length === 0,
    failures,
  };
}

/**
 * Processa a resposta de um agente através de um loop de reflexão básica (Basic Reflection).
 * Se a resposta falhar nos critérios de validação (score < 50 ou falta de campos estruturais),
 * o agente entra em um loop de reflexão de até 2 iterações recebendo feedback estruturado para refinar.
 * 
 * @param agent O agente a ser executado e re-invocado
 * @param originalInput A entrada original do agente
 * @returns A melhor resposta obtida durante o processamento
 */
export async function processWithAgent(agent: Agent, originalInput: string): Promise<AgentResponse> {
  // Garantir compatibilidade se a skill não estiver instalada
  const skillPath = path.resolve(process.cwd(), ".agents/skills/agentic-eval/SKILL.md");
  const isSkillInstalled = fs.existsSync(skillPath);

  if (!isSkillInstalled) {
    logger.warn("[ai-squad] A skill 'agentic-eval' não está instalada. Executando comportamento padrão.");
  }

  let iteration = 0;
  const maxIterations = 2;

  // 1. Run the agent and capture the response.
  const messages: ChatMessage[] = [
    { role: "user", content: originalInput }
  ];
  let currentResponse = await agent.run(messages);
  let bestResponse = currentResponse;

  // 2. Validate the response against the Context Handshake criteria
  let validation = validateResponse(currentResponse);

  // Emit log estruturado da primeira tentativa (iteração 0)
  const initialLog = {
    iteration: 0,
    score: currentResponse.score ?? 0,
    failures: validation.failures,
    converged: false,
    earlyStopped: false,
  };
  console.log(`[ai-squad] Initial run - ${JSON.stringify(initialLog)}`);

  // 3. If the response is valid, return it.
  if (validation.isValid) {
    return currentResponse;
  }

  // 4. If the response is invalid:
  let prevResponse = currentResponse;

  while (iteration < maxIterations) {
    iteration++;

    // Guardar o score anterior
    const prevScore = prevResponse.score ?? 0;

    // Formato exato do prompt de reflexão exigido
    const reflectionPrompt = `You are a senior product analyst. Your previous response failed quality validation.

Previous response:
${prevResponse.content || JSON.stringify(prevResponse)}

Validation failures:
${validation.failures.join("\n")}

Instructions:
1. Review the failures above carefully.
2. Keep all correct parts of your previous response.
3. Add or fix only the missing/incorrect parts.
4. Return a complete response that passes validation.
5. Do not invent data; if a value is genuinely unknown, mark it clearly.

Now rewrite your response.`;

    // Re-invoke agent with original input + previous response + structured feedback
    const nextMessages: ChatMessage[] = [
      { role: "user", content: originalInput },
      { role: "assistant", content: prevResponse.content },
      { role: "user", content: reflectionPrompt }
    ];

    const nextResponse = await agent.run(nextMessages);
    const nextValidation = validateResponse(nextResponse);
    const nextScore = nextResponse.score ?? 0;

    // Se a nova resposta for melhor que a melhor até agora, atualiza
    if (nextScore > (bestResponse.score ?? 0)) {
      // Preservar partes válidas/campos válidos que podem ter vindo da anterior se omitidos na nova
      const mergedResponse: AgentResponse = {
        ...bestResponse,
        ...nextResponse,
        // Nunca descarta a melhor análise se ela foi degradada
        analysis: nextResponse.analysis || bestResponse.analysis,
        status: nextResponse.status || bestResponse.status,
      };
      bestResponse = mergedResponse;
    }

    // Convergence check: se o score novo não for melhor que o anterior, para e retorna a melhor
    const converged = nextScore <= prevScore;
    
    // Logs estruturados por iteração
    const iterationLog = {
      iteration,
      score: nextScore,
      failures: nextValidation.failures,
      converged,
      earlyStopped: converged,
    };
    console.log(`[ai-squad] Reflection log - ${JSON.stringify(iterationLog)}`);
    logger.info(`Agent reflection iteration`, iterationLog);

    if (nextValidation.isValid) {
      return nextResponse;
    }

    if (converged) {
      break;
    }

    prevResponse = nextResponse;
    validation = nextValidation;
  }

  return bestResponse;
}
