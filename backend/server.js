import express from 'express';
import cors from 'cors';
import multer from 'multer'; // Required for file uploads
import axios from 'axios';   // Required for calling Python service and fetching image URLs
import fs from "fs";         // Required for loading product data
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// --- 1. CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the Node.js package.json has "type": "module"
const PORT = process.env.PORT || 5000;
const PYTHON_EMBED_URL = "https://visual-matcher-model.onrender.com/embed"; // <-- **VERIFY THIS URL**

// --- 2. UTILITY FUNCTIONS (Moved from utils/ and services/) ---

// Utility: Cosine Similarity Calculation
const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
        return 0;
    }
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return (magnitudeA === 0 || magnitudeB === 0) ? 0 : dotProduct / (magnitudeA * magnitudeB);
};

// Utility: Load Products (Handles data loading logic)
const loadProducts = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const products = JSON.parse(data);
        console.log(`Node LOG: Successfully loaded ${products.length} products from disk.`);
        return products;
    } catch (error) {
        console.error("CRITICAL ERROR: Failed to load product data:", error.message);
        return [];
    }
};

// --- 3. ML SERVICE COMMUNICATION ---

// Communication: Generates embedding by calling the Python service
const generateEmbedding = async (imageBase64) => {
    const payload = { imageBase64: imageBase64 };

    try {
        // Sends Base64 data as a JSON payload
        const response = await axios.post(PYTHON_EMBED_URL, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 90000 // Extended timeout for waking up the Python service
        });
        
        const embedding = response.data.embedding;

        if (!embedding || !Array.isArray(embedding)) {
            throw new Error("Invalid or empty embedding received from Python service.");
        }
        console.log(`Node LOG: Received embedding of length ${embedding.length}`);
        return embedding;

    } catch (error) {
        const pythonErrorMessage = error.response ? 
            `Python Error: ${error.response.data.error}` : 
            `Connection Error: ${error.message}`;
        
        console.error("Node ERROR: Embedding service failed:", pythonErrorMessage);
        throw new Error(`Embedding service failure: ${pythonErrorMessage}`);
    }
};

// --- 4. APP SETUP ---

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // Multer storage for files in memory
const products = loadProducts(path.join(__dirname, "data", "products_with_price.json"));

// --- 5. MIDDLEWARE & CONFIG ---

// Explicit CORS Configuration: MUST match your frontend URL
const ALLOWED_ORIGIN = "https://visual-matcher-frontend-pknp.onrender.com";
app.use(cors({
    origin: ALLOWED_ORIGIN,
    methods: "GET,POST",
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global error handler middleware
app.use((err, req, res, next) => {
    console.error(`GLOBAL ERROR HANDLER: ${err.stack}`);
    res.status(500).json({ 
        success: false, 
        message: "Internal Server Error during processing.",
        detail: err.message
    });
});

// --- 6. CORE CONTROLLER LOGIC (searchProducts) ---

const searchProducts = async (req, res, next) => {
    try {
        let imageBase64;
        let mimeType = 'image/jpeg'; 
        
        // ---- A. Handle Image Input (File, URL, or Base64 body) ----
        if (req.file && req.file.buffer) {
            // 1. File Upload (Multer Memory Buffer)
            const buffer = req.file.buffer;
            mimeType = req.file.mimetype || mimeType; 
            imageBase64 = `data:${mimeType};base64,${buffer.toString("base64")}`;
            console.log(`Node LOG: 1. Received uploaded file buffer, MIME: ${mimeType}`);

        } else if (req.body.imageFile && req.body.imageFile.startsWith("http")) {
            // 2. Image URL Input
            const response = await axios.get(req.body.imageFile, { responseType: "arraybuffer" });
            const contentType = response.headers['content-type'] || mimeType;
            const buffer = Buffer.from(response.data, "binary");
            imageBase64 = `data:${contentType};base64,${buffer.toString("base64")}`;
            console.log("Node LOG: 1. Fetched image from URL.");
            
        } else if (req.body.imageBase64) {
            // 3. Direct Base64 Input
            imageBase64 = req.body.imageBase64;
            console.log("Node LOG: 1. Received image via direct Base64 body.");
        }
        
        if (!imageBase64) {
            res.status(400);
            throw new Error("No valid image input provided.");
        }

        // ---- B. Get Embedding and Perform Search ----
        const embedding = await generateEmbedding(imageBase64); 

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

        res.status(200).json({ success: true, results });

    } catch (err) {
        // Send to global error handler
        next(err); 
    }
};

// --- 7. ROUTE DEFINITION (Fixes the "Not Found" Error) ---

// This defines the /api/search route and applies the Multer middleware
app.post('/api/search', upload.single('imageFile'), searchProducts);

// Fallback Route (Fixes the 404 Not Found error for undefined paths)
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Not Found - ${req.originalUrl}` });
});


// --- 8. START SERVER ---

app.listen(PORT, () => {
    console.log(`Server: API running on http://localhost:${PORT}`);
});








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
