import axios from "axios";

// This URL needs to be correctly set to your live Python service URL
const PYTHON_SERVICE_URL = 'https://visual-matcher-model.onrender.com/embed'; 

/**
 * Placeholder for module initialization logic.
 * The server currently just assumes the external Python service is running.
 */
export const loadFeatureExtractor = () => { 
    console.log("Node LOG: Backend ready to use external embedding service.");
    return Promise.resolve(true); 
};

/**
 * Sends the Base64 image string to the external Python service and retrieves the embedding vector.
 * @param {string} imageBase64 The base64 encoded image string (e.g., "data:image/jpeg;base64,...").
 * @returns {Promise<number[]>} The 1280-dimensional embedding vector.
 */
export const generateEmbedding = async (imageBase64) => {
    console.log("Node LOG: 1. Requesting embedding from Python service...");
    
    // Prepare JSON payload: The Python service expects a JSON body with the key imageBase64
    const payload = {
        imageBase64: imageBase64 
    };
    
    try {
        // CRITICAL FIX: Send Base64 data as a JSON payload, NOT FormData.
        const response = await axios.post(PYTHON_SERVICE_URL, payload, {
            headers: { 'Content-Type': 'application/json' },
            // Set a generous timeout (e.g., 90 seconds) for the ML model to wake up and process the image
            timeout: 90000 
        });
        
        const { embedding } = response.data;
        
        if (embedding && Array.isArray(embedding)) {
            const vectorLength = embedding.length;
            console.log(`Node LOG: 2. Successfully received vector of length ${vectorLength}.`);
            return embedding;
        } else {
            throw new Error("Python service returned invalid embedding format (not an array or null).");
        }

    } catch (error) {
        // Enhanced logging to capture the error passed from the Python service
        const pythonErrorMessage = error.response ? 
            `Python Error: ${error.response.data.error}` : 
            `Connection Error: ${error.message}. Is Python service running?`;
            
        console.error("Node ERROR: Failed to get embedding:", pythonErrorMessage);
        // Throw a specific error that the controller can catch and handle cleanly
        throw new Error(`Embedding service failed: ${pythonErrorMessage}`);
    }
};

// No longer needed for ES module syntax:
/*
module.exports = {
    loadFeatureExtractor: loadFeatureExtractor, 
    generateEmbedding: generateEmbedding,
    getIsModelLoaded: () => true, 
};
*/





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
