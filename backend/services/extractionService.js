const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Extracts structured data and generates a summary from document text using Gemini.
 * @param {string} documentText - The text extracted from the document
 * @returns {Promise<Object>} { extractedData, summary }
 */
async function extractDocumentData(documentText) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing or invalid.');
  }

  const systemInstruction = `You are an expert banking document extraction AI.
You receive OCR/extracted text from a customer loan or KYC document.
CRITICAL INSTRUCTIONS:
- Extract ONLY facts explicitly present in the document.
- Do NOT infer missing values or guess.
- Do NOT calculate financial metrics yourself.
- Do NOT invent customer information.
- Preserve monetary amounts accurately.
- Preserve percentages accurately.
- Preserve dates accurately.
- Return null for unavailable fields.
- For summary and findings, strictly separate raw facts from AI observations.
- Only generate questions that are reasonable based on missing or relevant information.
- Respond ONLY with valid JSON.`;

  // The required response schema
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      extractedData: {
        type: Type.OBJECT,
        properties: {
          customerName: { type: Type.STRING, nullable: true },
          customerId: { type: Type.STRING, nullable: true },
          loanType: { type: Type.STRING, nullable: true },
          loanAmount: { type: Type.NUMBER, nullable: true },
          annualIncome: { type: Type.NUMBER, nullable: true },
          employer: { type: Type.STRING, nullable: true },
          existingLiabilities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                amount: { type: Type.NUMBER }
              }
            }
          },
          loanTenure: { type: Type.STRING, nullable: true },
          interestRate: { type: Type.STRING, nullable: true },
          collateral: { type: Type.STRING, nullable: true },
          importantDates: { type: Type.ARRAY, items: { type: Type.STRING } },
          otherFinancialInformation: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      },
      summary: {
        type: Type.OBJECT,
        properties: {
          overview: { type: Type.STRING },
          keyFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
          importantFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
          missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
          openQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          attentionFlags: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    },
    required: ["extractedData", "summary"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: `DOCUMENT TEXT:\n${documentText}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1
      }
    });

    const text = response.text;
    
    try {
      const parsed = JSON.parse(text);
      if (!parsed.extractedData || !parsed.summary) {
        throw new Error('Missing structured sections');
      }
      return parsed;
    } catch (parseError) {
      console.error('Failed to parse or validate LLM response:', text);
      throw new Error('Document text was extracted, but structured extraction failed.');
    }
  } catch (error) {
    console.error('LLM Extraction Failed:', error.message);
    throw new Error('Document text was extracted, but structured extraction failed.');
  }
}

module.exports = {
  extractDocumentData
};
