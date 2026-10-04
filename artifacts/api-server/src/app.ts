import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./lib/auth-middleware";
import path from "path";
import fs from "fs";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());

// Stripe Webhook needs the raw body to verify signatures. We must mount it BEFORE express.json()
import stripeWebhookRouter from "./routes/stripe-webhook";
app.use("/api/webhook/stripe", express.raw({ type: 'application/json' }), stripeWebhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

// --- Serve Frontend Static Files ---
const staticPath = path.resolve(process.cwd(), "artifacts/salam-journey/dist/public");
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));

  // Catch-all route to serve index.html for React routing
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
  logger.info({ staticPath }, "Serving frontend static files from path");
} else {
  logger.warn({ staticPath }, "Frontend static path not found; only API will be available");
}

export default app;
