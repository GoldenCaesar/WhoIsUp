import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
app.use(express.json());
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "2.2.0",
    uptime: process.uptime()
  });
});
const PORT = Number(process.env.PORT) || 3e3;
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Floor Up System running live on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("[Server] Fatal startup error:", err);
  process.exit(1);
});
