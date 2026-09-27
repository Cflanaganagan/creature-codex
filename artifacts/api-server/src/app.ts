import path from "node:path";
import { readCollection } from "@workspace/db";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
// Render terminates TLS through one trusted reverse-proxy hop.
if (process.env.RENDER) app.set("trust proxy", 1);

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const publicOrigin = "https://woolly-a1we.onrender.com";
app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /import\nSitemap: ${publicOrigin}/sitemap.xml\n`);
});
app.get("/sitemap.xml", async (_req, res) => {
  try {
    const { creatures } = await readCollection();
    const paths = ["/", "/about", "/browse", "/timeline", "/mystery",
      ...creatures.map(creature => `/creature/${encodeURIComponent(creature.id)}`)];
    const escapeXml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
    const urls = paths.map(path => `<url><loc>${escapeXml(publicOrigin + path)}</loc></url>`).join("\n");
    res.set("Cache-Control", "public, max-age=300").type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
  } catch (error) {
    res.status(503).type("text/plain").send("Sitemap temporarily unavailable. Please try again shortly.");
  }
});

// Serve the collection and API together on a single host in production.
if (process.env.NODE_ENV === "production") {
  const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../every-creature/dist/public");
  app.use(express.static(publicDir));
  app.get("/{*path}", (req, res, next) => {
    if (req.path === "/api" || req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

export default app;
