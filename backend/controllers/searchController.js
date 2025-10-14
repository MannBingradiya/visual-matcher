import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import axios from "axios";

// Import modules with the correct ES module syntax
import { generateEmbedding } from "../config/embeddingService.js";
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
 * * NOTE: The function is exported using 'export const' to match the router's 'import { searchProducts }'.
 */
export const searchProducts = async (req, res, next) => {
    try {
        let imageBase64;

        // --- 1. Handle Image Input (File or URL) ---
        if (req.file) {
            // Logic for Multer-uploaded file (needs correct handling of file paths)
            const buffer = fs.readFileSync(req.file.path);
            imageBase64 = `data:image/${req.file.mimetype.split('/')[1]};base64,${buffer.toString("base64")}`;
            fs.unlinkSync(req.file.path); // Clean up the temporary file
            console.log(`Node LOG: Received uploaded file: ${req.file.originalname}`);
        } else if (req.body.imageFile && req.body.imageFile.startsWith("http")) {
            // Logic for image URL input (fetching the image buffer)
            const response = await axios.get(req.body.imageFile, { responseType: "arraybuffer" });
            const contentType = response.headers['content-type'] || 'image/jpeg';
            const buffer = Buffer.from(response.data, "binary");
            imageBase64 = `data:${contentType};base64,${buffer.toString("base64")}`;
            console.log("Node LOG: Fetched image from URL.");
        } else if (req.body.imageBase64) {
             // Direct Base64 input (if frontend already converted it)
            imageBase64 = req.body.imageBase64;
             console.log("Node LOG: Received image via direct Base64 body.");
        }
        
        if (!imageBase64) {
            res.status(400);
            throw new Error("No valid image file, URL, or Base64 data provided.");
        }

        // --- 2. Get Embedding (Call the dedicated service) ---
        console.log("Node LOG: Sending image to Python embedding service...");
        // Use the dedicated service function which handles the Axios/JSON forwarding
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
            .slice(0, 100); // Return top 100 results

        res.status(200).json({ results });

    } catch (err) {
        console.error(`Controller Runtime Error: ${err.message}`);
        // Pass the error to Express error handler middleware
        next(err); 
    }
};

// NOTE: Since you are using ES module 'import' syntax, you must also ensure your 
// backend/package.json file has "type": "module" added to it.
```

### Final Deployment Steps:

1.  **Update File:** Replace the content of your `backend/controllers/searchController.js` file with the code above.
2.  **Fix `package.json`:** If you haven't already, add `"type": "module"` to your **`backend/package.json`** file.
    ```json
    {
      "name": "backend",
      "version": "1.0.0",
      "description": "",
      "main": "server.js",
      "type": "module",  <-- ADD THIS LINE
      "scripts": {
        ...
      },
      ...
    }
    






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
