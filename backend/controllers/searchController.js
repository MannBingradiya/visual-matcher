// import fs from "fs";
// import path, { dirname } from "path";
// import { fileURLToPath } from "url";
// import axios from "axios";
// import { generateEmbedding } from "../config/embeddingService.js";
// import { cosineSimilarity } from "../utils/cosineSimilarity.js";
// import { loadProducts } from "../services/productService.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const PYTHON_EMBED_URL = "https://visual-matcher-model.onrender.com/embed";

// const products = loadProducts(path.join(__dirname, "../data/products_with_price.json"));

// export const searchProducts = async (req, res, next) => {
//   console.log("🚀 [Search Controller] Request received at /api/search");
//   try {
//     let imageBuffer;

//     // --- Handle uploaded file ---
//     if (req.file && req.file.buffer) {
//       imageBuffer = req.file.buffer;
//       console.log(`✅ Uploaded file received (${req.file.originalname}, ${imageBuffer.length} bytes)`);
//     } else if (req.body.imageFile && req.body.imageFile.startsWith("http")) {
//       console.log("Node LOG: Downloading image from URL...");
//       const response = await axios.get(req.body.imageFile, { responseType: "arraybuffer" });
//       imageBuffer = Buffer.from(response.data, "binary");
//     } else {
//       return res.status(400).json({ error: "No valid image file or URL provided." });
//     }

//     // --- Generate embedding from Python service ---
//     const embedding = await generateEmbedding(imageBuffer);
//     if (!embedding || !Array.isArray(embedding)) {
//       return res.status(500).json({ error: "Invalid embedding returned from model service." });
//     }

//     // --- Vector similarity search ---
//     const results = products
//       .map((p) => ({
//         id: p.id,
//         name: p.name,
//         category: p.category,
//         image_url: p.image_url,
//         similarityScore: cosineSimilarity(embedding, p.embedding),
//       }))
//       .sort((a, b) => b.similarityScore - a.similarityScore)
//       .slice(0, 100);

//     console.log(`Node LOG: Returning ${results.length} results.`);
//     res.status(200).json({ results });
//   } catch (err) {
//     console.error("Controller Runtime ERROR:", err.stack || err.message);
//     res.status(500).json({ error: "Failed to process image or complete search.", detail: err.message });
//     next(err);
//   }
// };






import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";
import { loadProducts } from "../services/productService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PYTHO_ENMBED_URL = "https://visual-matcher-model.onrender.com/embed";
const products = loadProducts(path.join(__dirname, "../data/products_with_price.json"));

export const searchProducts = async (req, res, next) => {
  try {  
    console.log("📦 Received search request");
    console.log("File:", req.file);
    let imageBase64;

    if (req.file) {
      // const buffer = fs.readFileSync(req.file.path);
      // imageBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      // fs.unlinkSync(req.file.path);
      // console.log(`Node LOG: Received uploaded file: ${req.file.originalname}`);
      console.log(`📦 Uploaded file received: ${req.file.originalname} (${req.file.size} bytes)`);
      imageBase64 = `data:image/jpeg;base64,${req.file.buffer.toString("base64")}`;
    }

    else if (req.body.imageFile && req.body.imageFile.startsWith("http")) {
      console.log(`🌐 Fetching image from URL: ${req.body.imageFile}`);
      const response = await axios.get(req.body.imageFile, { responseType: "arraybuffer" });
      imageBase64 = `data:image/jpeg;base64,${Buffer.from(response.data, "binary").toString("base64")}`;
      // const response = await axios.get(req.body.imageFile, { responseType: "arraybuffer" });
      // const buffer = Buffer.from(response.data, "binary");
      // imageBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      // console.log("Node LOG: Fetched image from URL.");
    } else {
      console.error("❌ No valid image provided in request");
      return res.status(400).json({ error: "No valid image file or URL provided." });
    }

    console.log("Node LOG: Sending image to Python embedding service...");
    const embedResponse = await axios.post(PYTHON_EMBED_URL, { imageBase64 });

    const { embedding } = embedResponse.data;
    console.log(" Model service response received!");
    console.log(" Embed service raw response keys:", Object.keys(embedResponse.data));
    if (!embedding || !Array.isArray(embedding)) {
      res.status(500);
      throw new Error("Invalid embedding format from Python service.");
    }
    console.log(`Node LOG: Received embedding of length ${embedding.length}`);

    const results = products
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        image_url: p.image_url,
        similarityScore: cosineSimilarity(embedding, p.embedding),
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 10);

    res.status(200).json({ results });
  } catch (err) {
    next(err); 
  }
};
