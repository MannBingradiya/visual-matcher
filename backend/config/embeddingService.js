import axios from "axios";

const PYTHON_SERVICE_URL = "https://visual-matcher-model.onrender.com/embed";

/**
 * Converts an image buffer to Base64 and sends it to the Python service.
 */
export async function generateEmbedding(imageBuffer, mimeType = "image/jpeg") {
  try {
    console.log("Node LOG: 1. Converting image buffer to base64...");
    const imageBase64 = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

    console.log("Node LOG: 2. Sending base64 image to Flask service...");
    const response = await axios.post(
      PYTHON_SERVICE_URL,
      { imageBase64 },
      { headers: { "Content-Type": "application/json" } }
    );

    if (response.data && Array.isArray(response.data.embedding)) {
      console.log(`Node LOG: 3. Received embedding vector (length: ${response.data.embedding.length})`);
      return response.data.embedding;
    } else {
      throw new Error("Python service returned invalid embedding format.");
    }
  } catch (error) {
    console.error("Node ERROR: Failed to get embedding from Python service:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Response:", error.response.data);
    } else {
      console.error("Message:", error.message);
    }
    throw new Error("Embedding service failed to process image.");
  }
}

export const loadFeatureExtractor = async () => {
  console.log("Node LOG: Backend ready to use external embedding service.");
  return true;
};

export const getIsModelLoaded = () => true;

export default { generateEmbedding, loadFeatureExtractor, getIsModelLoaded };




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
