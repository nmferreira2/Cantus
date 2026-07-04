import "dotenv/config";
import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { apiNotFound, errorHandler } from "./middleware/error.middleware.js";
import routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDirectory = path.join(__dirname, "../public");

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

if (process.env.NODE_ENV !== "test") {
    app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use("/api", routes);
app.use("/api", apiNotFound);

app.use(express.static(publicDirectory));

app.use((req, res, next) => {
    if (req.method === "GET" && req.accepts("html")) {
        return res.sendFile(path.join(publicDirectory, "index.html"));
    }

    return next();
});

app.use(errorHandler);

export default app;
