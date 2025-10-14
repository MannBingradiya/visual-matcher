import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";
import { loadProducts } from "../services/productService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PYTHON_EMBED_URL = "http://localhost:5001/embed";
const products = loadProducts(path.join(__dirname, "../data/products_with_price.json"));

export const searchProducts = async (req, res, next) => {
  try {
    let imageBase64;

    if (req.file) {
      const buffer = fs.readFileSync(req.file.path);
      imageBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      fs.unlinkSync(req.file.path);
      console.log(`Node LOG: Received uploaded file: ${req.file.originalname}`);
    }

    else if (req.body.imageFile && req.body.imageFile.startsWith("http")) {
      const response = await axios.get(req.body.imageFile, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data, "binary");
      imageBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      console.log("Node LOG: Fetched image from URL.");
    } else {
      res.status(400);
      throw new Error("No image file or URL provided.");
    }

    console.log("Node LOG: Sending image to Python embedding service...");
    const embedResponse = await axios.post(PYTHON_EMBED_URL, { imageBase64 });

    const { embedding } = embedResponse.data;
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
