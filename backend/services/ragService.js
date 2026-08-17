const fs = require('fs');
const path = require('path');

let cachedKnowledge = null;

function loadKnowledgeBase() {
  if (cachedKnowledge) return cachedKnowledge;
  
  const knowledgeDir = path.join(__dirname, '../knowledge');
  if (!fs.existsSync(knowledgeDir)) return [];

  const files = fs.readdirSync(knowledgeDir);
  const knowledgeDocs = [];

  for (const file of files) {
    if (file.endsWith('.txt')) {
      const content = fs.readFileSync(path.join(knowledgeDir, file), 'utf-8');
      knowledgeDocs.push({
        source: file,
        text: content
      });
    }
  }
  cachedKnowledge = knowledgeDocs;
  return cachedKnowledge;
}

/**
 * Retrieve relevant context for a query from local knowledge files.
 */
async function retrieveRelevantContext(query, topK = 4) {
  const docs = loadKnowledgeBase();
  if (docs.length === 0) {
    return "No relevant product information was found.";
  }

  const queryLower = (query || '').toLowerCase();
  
  // Filter or prioritize docs containing query keywords, or include all policy docs if short
  const relevantDocs = docs.filter(doc => {
    const textLower = doc.text.toLowerCase();
    const filenameLower = doc.source.toLowerCase();
    return queryLower.split(' ').some(word => word.length > 3 && (textLower.includes(word) || filenameLower.includes(word)));
  });

  const selectedDocs = relevantDocs.length > 0 ? relevantDocs : docs;

  return selectedDocs.map(c => `[Source: ${c.source}]\n${c.text}`).join('\n\n---\n\n');
}

module.exports = {
  retrieveRelevantContext
};

