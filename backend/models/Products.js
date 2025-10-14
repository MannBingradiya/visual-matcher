const fs = require('fs');
const path = require('path');
let productDatabase = [];
// const DB_FILE = 'products_final_with_embeddings.json'; 

function cosineSimilarity(vecA, vecB) {
    if (vecA.every(v => v === 0) || vecB.every(v => v === 0)) {
        return 0; 
    }
}

function findSimilarProducts(searchEmbedding) {
    console.log("Node LOG: 3. Starting search comparison...");

    const isVectorValid = searchEmbedding.some(v => v !== 0);
    console.log(`Node LOG: Search vector length: ${searchEmbedding.length}. Data present (non-zero): ${isVectorValid}`);
    let results = [];
    for (const product of productDatabase) {
        const score = cosineSimilarity(searchEmbedding, product.embedding); 
        
        results.push({
            ...product,
            similarityScore: score
        });
    }
    
    results.sort((a, b) => b.similarityScore - a.similarityScore);
    if (results.length > 0) {
        console.log(`Node LOG: Top Score: ${results[0].similarityScore.toFixed(5)} | Bottom Score: ${results[results.length - 1].similarityScore.toFixed(5)}`);
    }

    return results.slice(0, 100);
}
module.exports = {
    findSimilarProducts,
    getDatabaseSize: () => productDatabase.length 
};