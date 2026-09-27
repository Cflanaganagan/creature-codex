import path from "node:path";
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
