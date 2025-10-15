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





import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import axios from "axios";

// CRITICAL FIX: Use the Node.js recommended hybrid import for CommonJS files
// This assumes embeddingService.js uses 'module.exports = { generateEmbedding: ... }'
import * as embeddingService from "../config/embeddingService.js"; 
const { generateEmbedding } = embeddingService; // Safely destructure the named export


// CRITICAL FIX: Hybrid Imports for Local Utilities (Async Load)
// This loads the utilities safely and prevents crashing on startup.
let cosineSimilarity = (a, b) => 0; 
let loadProducts = () => []; 
let products = []; 

(async () => {
    try {
        const [utils, productService] = await Promise.all([
            import("../utils/cosineSimilarity.js"), // Assuming this is the path
            import("../services/productService.js")  // Assuming this is the path
        ]);

        cosineSimilarity = utils.cosineSimilarity || ((a, b) => 0);
        loadProducts = productService.loadProducts || (() => []);
        
        // Load products once the necessary functions are available
        products = loadProducts(path.join(__dirname, "../data/products_with_price.json"));
        console.log(`Node LOG: Utilities and Products loaded. DB Size: ${products.length}`);
    } catch (e) {
        console.error("CRITICAL ERROR: Failed to load local utility modules:", e);
    }
})();

// Set up __dirname and __filename equivalents for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


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
            
            imageBase64 = `data:${mimeType};base64,${buffer.toString("base64")}`;
            console.log(`Node LOG: Received uploaded file buffer, MIME: ${mimeType}`);

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
        console.log("Node LOG: Sending Base64 to Python service...");
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
        // CRITICAL: Log the full stack trace for debugging 500 errors
        console.error(`Controller Runtime ERROR: ${err.stack || err.message}`);
        
        // Return a clean 500 error to the client
        res.status(500).json({
            error: "Failed to process image or complete search. Check backend logs for detailed error.",
            detail: err.message
        });
        next(err); 
    }
};

