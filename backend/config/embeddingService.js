// backend/config/embeddingService.js

// const axios = require('axios');
// const FormData = require('form-data');

// const PYTHON_SERVICE_URL = 'http://localhost:5001/embed';

// // ... (loadFeatureExtractor and getIsModelLoaded functions remain the same) ...

// async function generateEmbedding(imageBuffer) {
//     console.log("Node LOG: 1. Requesting embedding from Python service...");
    
//     const formData = new FormData();
//     formData.append(
//         'imageFile', 
//         imageBuffer, 
//         { 
//             filename: 'search_image.jpg', 
//             contentType: 'image/jpeg' 
//         }
//     );
    
//     try {
//         const response = await axios.post(PYTHON_SERVICE_URL, formData, {
//             headers: formData.getHeaders(),
//             maxContentLength: Infinity,
//             maxBodyLength: Infinity
//         });
        
//         if (response.data && response.data.embedding && Array.isArray(response.data.embedding)) {
//             const vectorLength = response.data.embedding.length;
//             console.log(`Node LOG: 2. Successfully received vector of length ${vectorLength}.`);
//             return response.data.embedding;
//         } else {
//             throw new Error("Python service returned invalid embedding format (not an array or empty).");
//         }

//     } catch (error) {
//         const errorMessage = error.response ? 
//             `Python Error: ${error.response.data.error}` : 
//             `Connection Error: ${error.message}. Is Python service running on 5001?`;
            
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
//     getIsModelLoaded: () => true, 
// };









// backend/config/embeddingService.js

const axios = require('axios');
const FormData = require('form-data'); // ✅ Important import!

const PYTHON_SERVICE_URL = 'http://localhost:5001/embed';

async function generateEmbedding(imageBuffer) {
    console.log("Node LOG: 1. Requesting embedding from Python service...");

    // ✅ Create a proper FormData instance from 'form-data' library
    const formData = new FormData();
    formData.append('imageFile', imageBuffer, {
        filename: 'search_image.jpg',
        contentType: 'image/jpeg'
    });

    try {
        // ✅ Use formData.getHeaders() (works only with 'form-data' package)
        const response = await axios.post(PYTHON_SERVICE_URL, formData, {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        if (response.data && Array.isArray(response.data.embedding)) {
            const vectorLength = response.data.embedding.length;
            console.log(`Node LOG: 2. Successfully received vector of length ${vectorLength}.`);
            return response.data.embedding;
        } else {
            throw new Error("Python service returned invalid embedding format.");
        }

    } catch (error) {
        const errorMessage = error.response
            ? `Python Error: ${error.response.data.error}`
            : `Connection Error: ${error.message}. Is Python service running on 5001?`;

        console.error("Node ERROR: Failed to get embedding:", errorMessage);
        throw new Error("Embedding service failed to process image.");
    }
}

module.exports = {
    loadFeatureExtractor: () => {
        console.log("Node LOG: Backend ready to use external embedding service.");
        return Promise.resolve(true);
    },
    generateEmbedding,
    getIsModelLoaded: () => true
};
