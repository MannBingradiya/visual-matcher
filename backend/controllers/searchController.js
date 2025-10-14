import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import axios from "axios";

// CRITICAL FIX: Change named import to default import to handle CommonJS module
import embeddingService from "../config/embeddingService.js"; 
const { generateEmbedding } = embeddingService;

import { cosineSimilarity } from "../utils/cosineSimilarity.js"; // Assuming this utility path is correct
import { loadProducts } from "../services/productService.js"; // Assuming this service path is correct

// Set up __dirname and __filename equivalents for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// This URL needs to be correctly set to your live Python service URL
const PYTHON_EMBED_URL = "https://visual-matcher-model.onrender.com/embed"; 
// NOTE: We will use the generateEmbedding function instead of calling axios directly

// Load products once when the server starts
const products = loadProducts(path.join(__dirname, "../data/products_with_price.json"));

/**
 * Handles the search request, converting the image input (File/URL) into a Base64 string,
 * getting the embedding, and performing the final vector search.
 */
export const searchProducts = async (req, res, next) => {
    try {
        let imageBase64;
        let mimeType = 'image/jpeg'; 

        // --- 1. Handle Image Input (File, URL, or Base64 body) ---
        if (req.file && req.file.buffer) {
            // FIX: Read Buffer directly from memory (safest method on Render)
            const buffer = req.file.buffer;
            mimeType = req.file.mimetype || mimeType; 
            
            // REMOVED: fs.readFileSync and fs.unlinkSync, as we use the buffer directly
            
            imageBase64 = `data:${mimeType};base64,${buffer.toString("base64")}`;
            console.log(`Node LOG: Received uploaded file buffer: ${req.file.originalname}`);

        } else if (req.body.imageFile && req.body.imageFile.startsWith("http")) {
            // Logic for image URL input (fetching the image buffer)
            const response = await axios.get(req.body.imageFile, { responseType: "arraybuffer" });
            const contentType = response.headers['content-type'] || mimeType;
            const buffer = Buffer.from(response.data, "binary");
            imageBase64 = `data:${contentType};base64,${buffer.toString("base64")}`;
            console.log("Node LOG: Fetched image from URL.");
            
        } else if (req.body.imageBase64) {
             // Direct Base64 input
            imageBase64 = req.body.imageBase64;
             console.log("Node LOG: Received image via direct Base64 body.");
        }
        
        if (!imageBase64) {
            res.status(400);
            throw new Error("No valid image input provided.");
        }

        // --- 2. Get Embedding (Call the dedicated service) ---
        console.log("Node LOG: Sending image to Python embedding service...");
        const embedding = await generateEmbedding(imageBase64); 

        if (!embedding || !Array.isArray(embedding)) {
            res.status(500);
            throw new Error("Invalid or empty embedding received from Python service.");
        }
        console.log(`Node LOG: Received embedding of length ${embedding.length}`);

        // --- 3. Perform Vector Search ---
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

        res.status(200).json({ results });

    } catch (err) {
        // CRITICAL: Log the full stack trace to help debug the 502/500 errors
        console.error(`Controller Runtime ERROR: ${err.stack || err.message}`);
        
        // Return a simple 500 error to the client
        res.status(500).json({
            error: "Failed to process image or complete search. Check backend logs for detailed error.",
            detail: err.message
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
