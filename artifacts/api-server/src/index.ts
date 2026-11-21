import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] || "3100";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const host = "0.0.0.0";

const server = app.listen(port, host, () => {
  logger.info({ host, port }, "Server listening");
  console.log(`🚀 Salam-journey Server listening on ${host}:${port}`);
});

server.on("error", (err) => {
  logger.error({ err }, "Server error");
  console.error("❌ Server error:", err);
  process.exit(1);
});
