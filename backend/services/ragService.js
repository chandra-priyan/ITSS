const fs = require('fs');
const path = require('path');
const { generateEmbedding } = require('./embeddingService');

const vectorStore = []; // Simple in-memory store for demo

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

let isInitializing = false;

async function initializeKnowledgeBase() {
  if (vectorStore.length > 0 || isInitializing) return;
  isInitializing = true;
  
  try {
    const knowledgeDir = path.join(__dirname, '../knowledge');
    if (!fs.existsSync(knowledgeDir)) return;
    
    const files = fs.readdirSync(knowledgeDir);
    const chunkPromises = [];
    
    for (const file of files) {
      if (file.endsWith('.txt')) {
        const content = fs.readFileSync(path.join(knowledgeDir, file), 'utf-8');
        const chunks = content.split('\n\n').filter(c => c.trim().length > 0);
        
        for (const chunk of chunks) {
          chunkPromises.push(
            generateEmbedding(chunk)
              .then(embedding => {
                vectorStore.push({
                  id: `${file}-${vectorStore.length}`,
                  source: file,
                  text: chunk,
                  embedding
                });
              })
              .catch(e => {
                console.error(`Failed to embed chunk from ${file}: ${e.message}`);
              })
          );
        }
      }
    }
    await Promise.all(chunkPromises);
  } finally {
    isInitializing = false;
  }
}

/**
 * Retrieve relevant chunks for a customer's product query.
 */
async function retrieveRelevantContext(query, topK = 4) {
  await initializeKnowledgeBase();
  
  if (vectorStore.length === 0) {
    return "No relevant product information was found. Please verify the knowledge base.";
  }
  
  try {
    const queryEmbedding = await generateEmbedding(query);
    
    const scoredChunks = vectorStore.map(doc => ({
      ...doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding)
    }));
    
    // Sort descending by score
    scoredChunks.sort((a, b) => b.score - a.score);
    
    // Take top K chunks
    const topChunks = scoredChunks.slice(0, topK);
    
    return topChunks.map(c => `[Source: ${c.source}]\n${c.text}`).join('\n\n---\n\n');
  } catch (e) {
    console.error('RAG Retrieval failed:', e.message);
    throw new Error('Product information could not be retrieved. Please verify the product knowledge base.');
  }
}

module.exports = {
  retrieveRelevantContext
};
