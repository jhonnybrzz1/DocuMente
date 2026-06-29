import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("IA Evals & Fixtures Integrity Tests", () => {
  const casesDir = path.resolve(process.cwd(), "evals/cases");
  const runnersDir = path.resolve(process.cwd(), "evals/runners");

  it("deve conter a pasta de fixtures e os arquivos JSONL de casos de teste", () => {
    expect(fs.existsSync(casesDir)).toBe(true);

    const requiredCases = ["document-generation.jsonl", "chat-refinement.jsonl", "quick-actions.jsonl"];
    for (const file of requiredCases) {
      const filePath = path.join(casesDir, file);
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, "utf-8").trim();
      expect(content.length).toBeGreaterThan(0);

      // Validar formato JSONL
      const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
      expect(lines.length).toBeGreaterThan(0);

      for (const line of lines) {
        const parsed = JSON.parse(line);
        expect(parsed).toHaveProperty("id");
        if (file === "document-generation.jsonl") {
          expect(parsed).toHaveProperty("type");
          expect(parsed).toHaveProperty("input");
          expect(parsed).toHaveProperty("expectedSections");
          expect(Array.isArray(parsed.expectedSections)).toBe(true);
        }
      }
    }
  });

  it("deve conter os runners de avaliação regressiva baseados em rubricas e IA", () => {
    expect(fs.existsSync(runnersDir)).toBe(true);

    const requiredRunners = ["run-document-evals.ts", "run-ai-route-evals.ts"];
    for (const file of requiredRunners) {
      const filePath = path.join(runnersDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
      
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).toContain("checkPortOnline");
      expect(content).toContain("activePort");
    }
  });
});
