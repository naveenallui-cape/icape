import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import apiRouter from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

const app = express();

app.use(
  helmet({
    // Frontend (localhost:3000) calls API (localhost:5001) cross-origin
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      const allowed = new Set([
        env.frontendUrl,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ]);
      // Allow non-browser tools (no Origin) and configured frontend hosts
      if (!origin || allowed.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());

// Intentionally NO global rate limit — admin must not be throttled.
// Public result routes apply their own limiter in result.routes.ts.

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
