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

// ✅ Allow only your frontend domain
const ALLOWED_ORIGIN = "https://visual-matcher-frontend-pknp.onrender.com";

app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// ✅ Handle JSON + form data
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Mount search routes at /api/search
app.use("/api/search", searchRoutes);

// ✅ Health check endpoint
app.get("/", (req, res) => res.send("Backend running ✅"));

// ✅ Error-handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));




// import express from "express";
// import cors from "cors";
// import path from "path";
// import { fileURLToPath } from "url";
// import { dirname } from "path";
// import searchRoutes from "./routers/searchVisualMaching.js";
// import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const app = express();

// const ALLOWED_ORIGIN = "https://visual-matcher-frontend-pknp.onrender.com";

// app.use(cors({
//     origin: ALLOWED_ORIGIN,
//     methods: "GET,POST",
//     credentials: true,
// }));
// app.use(express.json({ limit: "20mb" }));
// app.use(express.urlencoded({ extended: true }));


// app.use("/api/search", searchRoutes);

// // app.use("/api", searchRoutes);

// app.get("/", (req, res) => res.send("Backend running ✅"));

// // Error-handling middlewares
// app.use(notFound);
// app.use(errorHandler);

// const PORT = 5000;
// app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
