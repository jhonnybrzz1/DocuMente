import { describe, it, expect, vi } from "vitest";
import { processWithAgent, validateResponse, AgentResponse, Agent, ChatMessage } from "../../server/services/ai-squad";

describe("AI Squad - Basic Reflection Loop Unit Tests", () => {
  it("deve validar respostas do Context Handshake corretamente", () => {
    // Válido
    const valid: AgentResponse = {
      content: "Tudo certo",
      score: 80,
      analysis: "Análise válida",
      status: "APPROVED",
    };
    expect(validateResponse(valid).isValid).toBe(true);
    expect(validateResponse(valid).failures).toHaveLength(0);

    // Score baixo
    const lowScore: AgentResponse = {
      content: "Tudo certo",
      score: 45,
      analysis: "Análise válida",
      status: "APPROVED",
    };
    expect(validateResponse(lowScore).isValid).toBe(false);
    expect(validateResponse(lowScore).failures[0]).toContain("Score 45 is below the minimum threshold of 50");

    // Faltando score
    const missingScore: AgentResponse = {
      content: "Tudo certo",
      score: undefined as any,
      analysis: "Análise válida",
      status: "APPROVED",
    };
    expect(validateResponse(missingScore).isValid).toBe(false);
    expect(validateResponse(missingScore).failures[0]).toContain("Missing required field: score");

    // Faltando campos exigidos (analysis ou status)
    const missingFields: AgentResponse = {
      content: "Tudo certo",
      score: 80,
      analysis: "",
      status: undefined,
    };
    const validation = validateResponse(missingFields);
    expect(validation.isValid).toBe(false);
    expect(validation.failures).toContain("Missing required field: analysis");
    expect(validation.failures).toContain("Missing required field: status");
  });

  it("deve retornar de primeira se a resposta inicial for válida (valid first response)", async () => {
    const validResponse: AgentResponse = {
      content: "Primeira resposta excelente",
      score: 90,
      analysis: "Análise inicial completa",
      status: "SUCCESS",
    };

    const agent: Agent = {
      run: vi.fn().mockResolvedValue(validResponse),
    };

    const result = await processWithAgent(agent, "Entrada original");
    expect(result).toEqual(validResponse);
    expect(agent.run).toHaveBeenCalledTimes(1);
  });

  it("deve resolver na segunda tentativa (one retry success)", async () => {
    const firstInvalidResponse: AgentResponse = {
      content: "Resposta incompleta",
      score: 40,
      analysis: "",
      status: "PENDING",
    };

    const secondValidResponse: AgentResponse = {
      content: "Resposta corrigida e completa",
      score: 75,
      analysis: "Análise agora preenchida",
      status: "SUCCESS",
    };

    const agent: Agent = {
      run: vi
        .fn()
        .mockResolvedValueOnce(firstInvalidResponse)
        .mockResolvedValueOnce(secondValidResponse),
    };

    const result = await processWithAgent(agent, "Entrada original");
    expect(result).toEqual(secondValidResponse);
    expect(agent.run).toHaveBeenCalledTimes(2);

    // Verificar se re-invocou com o prompt estruturado de reflexão
    const calls = (agent.run as any).mock.calls;
    const reflectionMessages: ChatMessage[] = calls[1][0];
    expect(reflectionMessages).toHaveLength(3);
    expect(reflectionMessages[0].content).toBe("Entrada original");
    expect(reflectionMessages[1].content).toBe("Resposta incompleta");
    expect(reflectionMessages[2].content).toContain("You are a senior product analyst. Your previous response failed quality validation.");
    expect(reflectionMessages[2].content).toContain("Validation failures:");
    expect(reflectionMessages[2].content).toContain("Instructions:");
  });

  it("deve esgotar as 2 tentativas e retornar a melhor resposta (two retries then fallback)", async () => {
    const initial: AgentResponse = {
      content: "Inicial ruim",
      score: 30,
      analysis: "",
      status: "PENDING",
    };

    const retry1: AgentResponse = {
      content: "Melhorou um pouco mas continua sem análise",
      score: 45,
      analysis: "",
      status: "PENDING",
    };

    const retry2: AgentResponse = {
      content: "Melhorou mais um pouco mas ainda inválida",
      score: 48,
      analysis: "",
      status: "PENDING",
    };

    const agent: Agent = {
      run: vi
        .fn()
        .mockResolvedValueOnce(initial)
        .mockResolvedValueOnce(retry1)
        .mockResolvedValueOnce(retry2),
    };

    const result = await processWithAgent(agent, "Entrada original");
    // Deve retornar retry2 (score 48), que é a melhor das inválidas
    expect(result.score).toBe(48);
    expect(agent.run).toHaveBeenCalledTimes(3); // Inicial + 2 retries
  });

  it("deve parar o loop cedo caso não haja melhora (no improvement convergence)", async () => {
    const initial: AgentResponse = {
      content: "Inicial ruim",
      score: 40,
      analysis: "",
      status: "PENDING",
    };

    const retry1: AgentResponse = {
      content: "Igual ou pior",
      score: 35,
      analysis: "",
      status: "PENDING",
    };

    const agent: Agent = {
      run: vi
        .fn()
        .mockResolvedValueOnce(initial)
        .mockResolvedValueOnce(retry1),
    };

    const result = await processWithAgent(agent, "Entrada original");
    // Como score caiu de 40 para 35, o loop converge e para imediatamente após a iteração 1
    expect(result.score).toBe(40); // Retorna a inicial pois foi a melhor
    expect(agent.run).toHaveBeenCalledTimes(2); // Inicial + 1 retry
  });

  it("deve tratar falha de campos obrigatórios mesmo com score alto (missing required fields)", async () => {
    const initial: AgentResponse = {
      content: "Score alto mas sem campos estruturais",
      score: 95,
      analysis: "",
      status: undefined,
    };

    const fixed: AgentResponse = {
      content: "Agora com todos os campos",
      score: 95,
      analysis: "Análise preenchida",
      status: "SUCCESS",
    };

    const agent: Agent = {
      run: vi
        .fn()
        .mockResolvedValueOnce(initial)
        .mockResolvedValueOnce(fixed),
    };

    const result = await processWithAgent(agent, "Entrada original");
    expect(result).toEqual(fixed);
    expect(agent.run).toHaveBeenCalledTimes(2);
  });
});
