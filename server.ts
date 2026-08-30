import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiRoutes from "./server/routes/api.ts";
import { db } from "./server/services/db.ts";
import { config } from "./server/config/config.ts";

async function startServer() {
  const app = express();
  const PORT = config.port || 3000;

  // Initialize Database and Seeded Documents
  await db.init();

  // Basic Middlewares
  app.use(cors());
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ extended: true, limit: "30mb" }));

  // API Routes FIRST
  app.use("/api", apiRoutes);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CampusIQ Server] Ready and running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[CampusIQ Server] Fatal startup error:", err);
  process.exit(1);
});
