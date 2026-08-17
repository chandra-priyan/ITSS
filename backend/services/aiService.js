const { GoogleGenAI, Type } = require('@google/genai');
const axios = require('axios');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const withTimeout = (promise, ms) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`AI Request timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

/**
 * NVIDIA API (minimaxai/minimax-m3) fallback completion helper.
 */
async function callNvidiaFallback(systemInstruction, payload, timeoutMs = 25000) {
  const apiKey = process.env.NVIDIA_API_KEY || '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';
  console.log('[AI Service] Calling NVIDIA API (minimaxai/minimax-m3) fallback...');
  const res = await axios.post(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      model: 'minimaxai/minimax-m3',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: typeof payload === 'string' ? payload : JSON.stringify(payload) }
      ],
      temperature: 0.2,
      top_p: 0.95,
      max_tokens: 4096
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: timeoutMs
    }
  );
  const rawText = res.data?.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('NVIDIA API returned empty response.');
  
  const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleanedText);
}

/**
 * Executes LLM completion with Google Gemini as Primary and NVIDIA API (minimaxai/minimax-m3) as Fallback.
 */
async function callLLM(systemInstruction, payload, responseSchema, timeoutMs = 25000) {
  let geminiErr = null;

  // 1. Primary Provider: Google Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('[AI Service] Calling Primary: Google Gemini (gemini-flash-latest)...');
      const response = await withTimeout(ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: typeof payload === 'string' ? payload : JSON.stringify(payload),
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.2
        }
      }), timeoutMs);

      const text = response.text;
      return JSON.parse(text);
    } catch (err) {
      geminiErr = err;
      console.warn('[AI Service] Primary Google Gemini call failed:', err.message);
      console.log('[AI Service] Falling back to NVIDIA API (minimaxai/minimax-m3)...');
    }
  }

  // 2. Fallback Provider: NVIDIA API (minimaxai/minimax-m3)
  try {
    return await callNvidiaFallback(systemInstruction, payload, timeoutMs);
  } catch (nvidiaErr) {
    console.error('[AI Service] NVIDIA Fallback call failed:', nvidiaErr.response?.data || nvidiaErr.message);
    throw new Error(`All AI providers failed. Gemini: ${geminiErr?.message || 'N/A'}. NVIDIA: ${nvidiaErr.message}`);
  }
}

/**
 * Generates an AI risk brief.
 */
async function generateCreditBrief(customerName, financialFacts, riskLevel, riskScore, riskFactors) {
  const payload = {
    customer: { name: customerName },
    financialFacts,
    risk: {
      level: riskLevel,
      score: riskScore,
      factors: riskFactors
    }
  };

  const systemInstruction = `You are a banking Relationship Manager risk-brief assistant.
You are given pre-calculated deterministic financial facts and a risk classification.
CRITICAL INSTRUCTIONS:
- Use ONLY the supplied facts.
- Do NOT invent values.
- Do NOT calculate new financial values.
- Do NOT change the risk level.
- Do NOT provide unsupported conclusions.
- Clearly distinguish facts from questions.
- Use concise professional banking language.
- Do NOT make final lending/credit approval decisions (this is decision support for an RM).
- Respond ONLY with valid JSON exactly matching the schema. Do not include markdown formatting or code blocks.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: "A concise 2-3 sentence overview of the risk and financial position." },
      keyFindings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 bullet points highlighting key deterministic facts." },
      openQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 questions the RM should ask the customer based on the data." },
      recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-2 recommended next steps for the RM to take." }
    },
    required: ["summary", "keyFindings", "openQuestions", "recommendedActions"]
  };

  try {
    const parsed = await callLLM(systemInstruction, payload, responseSchema, 25000);
    if (typeof parsed.summary !== 'string') throw new Error('Invalid summary format');
    if (!Array.isArray(parsed.keyFindings)) throw new Error('Invalid keyFindings format');
    return parsed;
  } catch (error) {
    console.error('AI Request Failed:', error.message);
    throw new Error(error.message);
  }
}

/**
 * Generates loan counselling prep.
 */
async function generateCounsellingPrep(customerFacts, ragContext) {
  const systemInstruction = `You are a banking Relationship Manager assistant preparing for a loan counselling discussion.
You are given a set of customer financial facts and retrieved knowledge base context about the bank's policies/products.
CRITICAL INSTRUCTIONS:
- Use ONLY the supplied customer facts.
- Use ONLY the retrieved knowledge for product/policy information.
- Do NOT invent bank policies or eligibility criteria.
- Do NOT invent documents.
- Do NOT make loan approval decisions.
- Clearly identify questions that require RM verification.
- Keep the response concise.
- Produce structured JSON only.`;

  const payload = { customerFacts, retrievedKnowledge: ragContext };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      customerSnapshot: { type: Type.ARRAY, items: { type: Type.STRING } },
      talkingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
      questionsToAsk: { type: Type.ARRAY, items: { type: Type.STRING } },
      documentChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
      productConsiderations: { type: Type.ARRAY, items: { type: Type.STRING } },
      potentialConcerns: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["customerSnapshot", "talkingPoints", "questionsToAsk", "documentChecklist", "productConsiderations", "potentialConcerns"]
  };

  try {
    const parsed = await callLLM(systemInstruction, payload, responseSchema, 25000);
    if (!Array.isArray(parsed.customerSnapshot)) throw new Error('Invalid format');
    return parsed;
  } catch (error) {
    console.error('AI Request Failed:', error.message);
    throw new Error('Counselling preparation could not be generated. Please try again.');
  }
}

/**
 * Generates an explanation for the deterministic limit increase decision.
 */
async function generateLimitIncreaseExplanation(customerName, financialFacts, riskLevel, decisionResult) {
  const payload = { customerName, financialFacts, riskLevel, decisionResult };

  const systemInstruction = `You are a banking Relationship Manager decision-support explanation assistant.
The decision (ASK, ASK_WITH_CONDITIONS, or HOLD_OFF) has already been determined by deterministic rules.
CRITICAL INSTRUCTIONS:
- Do NOT change the decision.
- Do NOT recalculate financial metrics.
- Do NOT invent financial values or customer information.
- Explain ONLY the supplied factors and conditions.
- Clearly identify items requiring RM verification based on conditions.
- Do NOT approve or reject credit.
- Do NOT make an autonomous lending decision.
- Produce structured JSON only.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: "1-2 sentences explaining the decision based on the factors." },
      reasoning: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bullet points explaining the factors." },
      conditions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Any conditions identified." },
      openQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Questions for the RM to verify." },
      recommendedNextSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Next actions for RM." }
    },
    required: ["summary", "reasoning", "conditions", "openQuestions", "recommendedNextSteps"]
  };

  try {
    const parsed = await callLLM(systemInstruction, payload, responseSchema, 25000);
    if (typeof parsed.summary !== 'string') throw new Error('Invalid format');
    return parsed;
  } catch (error) {
    console.error('AI Request Failed:', error.message);
    throw new Error('AI explanation could not be generated.');
  }
}

module.exports = {
  generateCreditBrief,
  generateCounsellingPrep,
  generateLimitIncreaseExplanation
};

