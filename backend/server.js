import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import searchRoutes from "./routers/searchVisualMaching.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const ALLOWED_ORIGIN = "https://visual-matcher-frontend-pknp.onrender.com";

app.use(cors({
    origin: ALLOWED_ORIGIN,
    methods: "GET,POST",
    credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));


app.use("/api/search", searchRoutes);

app.use("/api", searchRoutes);

app.get("/", (req, res) => res.send("Backend running ✅"));

// Error-handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
