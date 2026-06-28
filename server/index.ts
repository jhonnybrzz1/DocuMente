import express, { type Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS Middleware para integração local com AiChatFlow1 e agentes externos
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Rate limiting geral para API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: { message: "Muitas requisições. Tente novamente em alguns minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting mais restritivo para geração de documentos (usa API OpenRouter)
const generationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 gerações por minuto
  message: { message: "Limite de geração atingido. Aguarde um minuto." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para upload de arquivos
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // máximo 20 uploads por minuto
  message: { message: "Muitos uploads. Aguarde um minuto." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting
app.use("/api/", generalLimiter);
app.use("/api/generate-document", generationLimiter);
app.use("/api/preview-document", generationLimiter);
app.use("/api/upload", uploadLimiter);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Cópia rasa limpa para logs seguros
        const cleanLog: Record<string, any> = { ...capturedJsonResponse };
        if (typeof cleanLog.content === "string") {
          cleanLog.content = `[CONTENT_TRUNCATED_${cleanLog.content.length}_CHARS]`;
        }
        if (cleanLog.document && typeof cleanLog.document.content === "string") {
          cleanLog.document = { 
            ...cleanLog.document, 
            content: `[CONTENT_TRUNCATED_${cleanLog.document.content.length}_CHARS]` 
          };
        }
        if (typeof cleanLog.extractedText === "string") {
          cleanLog.extractedText = `[EXTRACTED_TEXT_TRUNCATED_${cleanLog.extractedText.length}_CHARS]`;
        }
        if (typeof cleanLog.demand === "string") {
          cleanLog.demand = `[DEMAND_TRUNCATED_${cleanLog.demand.length}_CHARS]`;
        }
        logLine += ` :: ${JSON.stringify(cleanLog)}`;
      }

      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize API key on startup
  try {
    const existingKey = await storage.getActiveApiKey();
    if (!existingKey && process.env.OPENROUTER_API_KEY) {
      await storage.createApiKey({ mistralKey: process.env.OPENROUTER_API_KEY });
      log("OpenRouter API key initialized from environment");
    }
  } catch (error) {
    console.error("Failed to initialize API key:", error);
  }

  const server = await registerRoutes(app);

  app.use((err: Error & { status?: number; statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(`[ERROR] ${status}: ${message}`);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
