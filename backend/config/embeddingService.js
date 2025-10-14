import axios from "axios";

const PYTHON_SERVICE_URL = "https://visual-matcher-model.onrender.com/embed";

/**
 * Sends base64 image to Python service and retrieves embedding vector
 */
async function generateEmbedding(imageBase64) {
  console.log("Node LOG: 1. Sending Base64 image to Python service...");

  try {
    const response = await axios.post(
      PYTHON_SERVICE_URL,
      { imageBase64 }, // JSON body with key matching Flask expectation
      {
        headers: { "Content-Type": "application/json" },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    if (response.data && Array.isArray(response.data.embedding)) {
      console.log(`Node LOG: 2. Received embedding (length: ${response.data.embedding.length})`);
      return response.data.embedding;
    } else {
      throw new Error("Python service returned invalid embedding format.");
    }

  } catch (error) {
    const errMsg = error.response
      ? `Python Error: ${JSON.stringify(error.response.data)}`
      : `Connection Error: ${error.message}`;
    console.error("Node ERROR: Failed to get embedding:", errMsg);
    throw new Error("Embedding service failed to process image.");
  }
}

export default {
  loadFeatureExtractor: async () => {
    console.log("Node LOG: Backend ready to use external embedding service.");
    return true;
  },
  generateEmbedding,
  getIsModelLoaded: () => true,
};










// // backend/config/embeddingService.js

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
