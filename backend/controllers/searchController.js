import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import axios from "axios";

// Import embedding service (CommonJS default export)
import embeddingService from "../config/embeddingService.js";
const { generateEmbedding } = embeddingService;

import { cosineSimilarity } from "../utils/cosineSimilarity.js";
import { loadProducts } from "../services/productService.js";

// --- Resolve current directory ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Python model service endpoint ---
const PYTHON_EMBED_URL = "https://visual-matcher-model.onrender.com/embed";

// --- Load product dataset once on startup ---
const products = loadProducts(path.join(__dirname, "../data/products_with_price.json"));

/**
 * Controller: Handles image upload, embedding generation, and similarity search
 */
export const searchProducts = async (req, res, next) => {
  try {
    let imageBase64;
    let mimeType = "image/jpeg";

    // --- 1. Handle Image Input (File, URL, or Base64 body) ---
    if (req.file && req.file.buffer) {
      const buffer = req.file.buffer;
      mimeType = req.file.mimetype || mimeType;

      // Convert to Base64 string for local reference/logging (not for sending)
      imageBase64 = `data:${mimeType};base64,${buffer.toString("base64")}`;
      console.log(`Node LOG: Received uploaded file buffer (MIME: ${mimeType}, size: ${buffer.length} bytes)`);

      // --- 2. Convert Base64 → Buffer before sending to Python ---
      const imageBuffer = Buffer.from(imageBase64.split(",")[1], "base64");
      console.log("Node LOG: Converted Base64 to binary buffer for embedding service.");

      // --- 3. Request embedding from Python service ---
      console.log(`Node LOG: Sending image buffer (${imageBuffer.length} bytes) to Python service...`);
      const embedding = await generateEmbedding(imageBuffer);

      if (!embedding || !Array.isArray(embedding)) {
        res.status(500);
        throw new Error("Invalid or empty embedding received from Python service.");
      }
      console.log(`Node LOG: Successfully received embedding vector (length: ${embedding.length})`);

      // --- 4. Perform Vector Search ---
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

      console.log(`Node LOG: Returning ${results.length} search results.`);
      return res.status(200).json({ results });

    } else if (req.body.imageFile && req.body.imageFile.startsWith("http")) {
      // --- Handle image URL input ---
      const response = await axios.get(req.body.imageFile, { responseType: "arraybuffer" });
      const contentType = response.headers["content-type"] || mimeType;
      const buffer = Buffer.from(response.data, "binary");
      console.log(`Node LOG: Downloaded image from URL (${buffer.length} bytes).`);

      const embedding = await generateEmbedding(buffer);
      if (!embedding || !Array.isArray(embedding)) {
        res.status(500);
        throw new Error("Invalid or empty embedding received from Python service (URL input).");
      }

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

      return res.status(200).json({ results });

    } else {
      res.status(400);
      throw new Error("No valid image file or URL provided.");
    }

  } catch (err) {
    console.error("Controller Runtime ERROR:", err.stack || err.message);

    res.status(500).json({
      error: "Failed to process image or complete search.",
      detail: err.message,
    });
    next(err);
  }
};



// import axios from "axios";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import { dirname } from "path";
// import { cosineSimilarity } from "../utils/cosineSimilarity.js";
// import { loadProducts } from "../services/productService.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const PYTHON_EMBED_URL = "https://visual-matcher-model.onrender.com/embed";
// const products = loadProducts(path.join(__dirname, "../data/products_with_price.json"));

// export const searchProducts = async (req, res, next) => {
//   try {
//     let imageBase64;

//     if (req.file) {
//       const buffer = fs.readFileSync(req.file.path);
//       imageBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
//       fs.unlinkSync(req.file.path);
//       console.log(`Node LOG: Received uploaded file: ${req.file.originalname}`);
//     }

//     else if (req.body.imageFile && req.body.imageFile.startsWith("http")) {
//       const response = await axios.get(req.body.imageFile, { responseType: "arraybuffer" });
//       const buffer = Buffer.from(response.data, "binary");
//       imageBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
//       console.log("Node LOG: Fetched image from URL.");
//     } else {
//       res.status(400);
//       throw new Error("No image file or URL provided.");
//     }

//     console.log("Node LOG: Sending image to Python embedding service...");
//     const embedResponse = await axios.post(PYTHON_EMBED_URL, { imageBase64 });

//     const { embedding } = embedResponse.data;
//     if (!embedding || !Array.isArray(embedding)) {
//       res.status(500);
//       throw new Error("Invalid embedding format from Python service.");
//     }
//     console.log(`Node LOG: Received embedding of length ${embedding.length}`);

//     const results = products
//       .map((p) => ({
//         id: p.id,
//         name: p.name,
//         category: p.category,
//         image_url: p.image_url,
//         similarityScore: cosineSimilarity(embedding, p.embedding),
//       }))
//       .sort((a, b) => b.similarityScore - a.similarityScore)
//       .slice(0, 10);

//     res.status(200).json({ results });
//   } catch (err) {
//     next(err); 
//   }
// };
