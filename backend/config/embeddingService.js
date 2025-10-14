import axios from "axios";

const PYTHON_SERVICE_URL = "https://visual-matcher-model.onrender.com/embed";

/**
 * Generates embedding by sending base64 image to Python service
 */
export async function generateEmbedding(imageBuffer) {
    console.log("Node LOG: Sending base64 image to Python service...");

    // Convert binary buffer to Base64
    const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;

    try {
        const response = await axios.post(
            PYTHON_SERVICE_URL,
            { imageBase64 },
            { headers: { "Content-Type": "application/json" }, timeout: 60000 }
        );

        if (response.data && Array.isArray(response.data.embedding)) {
            console.log(`Node LOG: Received embedding of length ${response.data.embedding.length}`);
            return response.data.embedding;
        } else {
            throw new Error("Invalid embedding response format from Python service.");
        }
    } catch (error) {
        console.error("Node ERROR: Failed to get embedding:", error.message);
        if (error.response) {
            console.error("Python response:", error.response.data);
        }
        throw new Error("Embedding service failed to process image.");
    }
}

export function loadFeatureExtractor() {
    console.log("Node LOG: Embedding service ready.");
    return Promise.resolve(true);
}

export function getIsModelLoaded() {
    return true;
}





// const axios = require('axios');
// const FormData = require('form-data'); 

// const PYTHON_SERVICE_URL = 'https://visual-matcher-model.onrender.com/embed';

// async function generateEmbedding(imageBuffer) {
//     console.log("Node LOG: 1. Requesting embedding from Python service...");

//     const formData = new FormData();
//     formData.append('imageFile', imageBuffer, {
//         filename: 'search_image.jpg',
//         contentType: 'image/jpeg'
//     });

//     try {
//         const response = await axios.post(PYTHON_SERVICE_URL, formData, {
//             headers: formData.getHeaders(),
//             maxContentLength: Infinity,
//             maxBodyLength: Infinity
//         });

//         if (response.data && Array.isArray(response.data.embedding)) {
//             const vectorLength = response.data.embedding.length;
//             console.log(`Node LOG: 2. Successfully received vector of length ${vectorLength}.`);
//             return response.data.embedding;
//         } else {
//             throw new Error("Python service returned invalid embedding format.");
//         }

//     } catch (error) {
//         const errorMessage = error.response
//             ? `Python Error: ${error.response.data.error}`
//             : `Connection Error: ${error.message}. Is Python service running on 5001?`;

//         console.error("Node ERROR: Failed to get embedding:", errorMessage);
//         throw new Error("Embedding service failed to process image.");
//     }
// }

// module.exports = {
//     loadFeatureExtractor: () => {
//         console.log("Node LOG: Backend ready to use external embedding service.");
//         return Promise.resolve(true);
//     },
//     generateEmbedding,
//     getIsModelLoaded: () => true
// };
