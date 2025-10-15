import express from "express";
import multer from "multer";
import cors from "cors";
import path, { dirname } from "path";
import fs from "fs";
import axios from "axios";
import { fileURLToPath } from "url";
import { cosineSimilarity } from "./utils/cosineSimilarity.js";
import { loadProducts } from "./services/productService.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Multer setup — store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Python model service URL
const PYTHON_EMBED_URL = "https://visual-matcher-model.onrender.com/embed";

// Load product embeddings
const products = loadProducts(path.join(__dirname, "./data/products_with_price.json"));

// 🧠 Generate embedding from Flask API
async function generateEmbedding(imageBase64) {
  try {
    const response = await axios.post(PYTHON_EMBED_URL, { imageBase64 });
    return response.data.embedding;
  } catch (err) {
    console.error("❌ Python service error:", err.message);
    throw new Error("Failed to fetch embedding from Python service");
  }
}

// 🔍 Search endpoint
app.post("/api/search", upload.single("imageFile"), async (req, res) => {
  try {
    let imageBase64;
    let mimeType = req.file?.mimetype || "image/jpeg";

    if (req.file && req.file.buffer) {
      // Convert uploaded file to Base64
      const buffer = req.file.buffer;
      imageBase64 = `data:${mimeType};base64,${buffer.toString("base64")}`;
      console.log(`✅ Received image file (size: ${buffer.length} bytes, type: ${mimeType})`);
    } else if (req.body.imageFile && req.body.imageFile.startsWith("http")) {
      // Handle image URL
      const response = await axios.get(req.body.imageFile, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data, "binary");
      const contentType = response.headers["content-type"] || mimeType;
      imageBase64 = `data:${contentType};base64,${buffer.toString("base64")}`;
      console.log("✅ Fetched image from URL");
    } else {
      return res.status(400).json({ error: "No valid image provided." });
    }

    // Generate embedding
    console.log("🚀 Sending image to Python service for embedding...");
    const embedding = await generateEmbedding(imageBase64);

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error("Invalid embedding received from Python service");
    }
    console.log(`✅ Embedding received (length: ${embedding.length})`);

    // Perform vector similarity search
    const results = products
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        image_url: p.image_url,
        similarityScore: cosineSimilarity(embedding, p.embedding),
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 100);

    console.log(`✅ Returning ${results.length} search results`);
    return res.status(200).json({ results });
  } catch (err) {
    console.error("🔥 Controller Error:", err.stack || err.message);
    return res.status(500).json({
      error: "Internal Server Error",
      detail: err.message,
    });
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("Visual Matcher Backend is running ✅");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));







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

// const allowedOrigins = [
//   "https://visual-matcher-frontend-pknp.onrender.com",
//   "http://localhost:3000"
// ];

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   methods: "GET,POST",
//   credentials: true,
// }));
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true }));

// app.use((req, res, next) => {
//   console.log(`➡️  ${req.method} ${req.url}`);
//   next();
// });

// app.use("/api", searchRoutes);

// // Error-handling middlewares
// app.use(notFound);
// app.use(errorHandler);

// const PORT = 5000;
// app.listen(PORT, () => console.log(`✅ Server running on http://localhost:5000`));
