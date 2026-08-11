const { GoogleGenAI, Type, Schema } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generates an AI risk brief using Google Gemini.
 */
async function generateCreditBrief(customerName, financialFacts, riskLevel, riskScore, riskFactors) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing or invalid.');
  }

  const payload = {
    customer: {
      name: customerName
    },
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
      summary: {
        type: Type.STRING,
        description: "A concise 2-3 sentence overview of the risk and financial position."
      },
      keyFindings: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3-4 bullet points highlighting key deterministic facts."
      },
      openQuestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "2-3 questions the RM should ask the customer based on the data."
      },
      recommendedActions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "1-2 recommended next steps for the RM to take."
      }
    },
    required: ["summary", "keyFindings", "openQuestions", "recommendedActions"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: JSON.stringify(payload),
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2
      }
    });

    const text = response.text;
    
    // Safety check parsing
    try {
      const parsed = JSON.parse(text);
      
      // Validation
      if (typeof parsed.summary !== 'string') throw new Error('Invalid summary format');
      if (!Array.isArray(parsed.keyFindings)) throw new Error('Invalid keyFindings format');
      if (!Array.isArray(parsed.openQuestions)) throw new Error('Invalid openQuestions format');
      if (!Array.isArray(parsed.recommendedActions)) throw new Error('Invalid recommendedActions format');

      return parsed;
    } catch (parseError) {
      console.error('Failed to parse or validate LLM response:', text);
      throw new Error('AI returned an invalid response format.');
    }
  } catch (error) {
    console.error('LLM Request Failed:', error.message);
    throw new Error(error.message);
  }
}

/**
 * Generates loan counselling prep using Google Gemini + RAG Context.
 */
async function generateCounsellingPrep(customerFacts, ragContext) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing or invalid.');
  }

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

  const payload = {
    customerFacts,
    retrievedKnowledge: ragContext
  };

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
    required: [
      "customerSnapshot", "talkingPoints", "questionsToAsk", 
      "documentChecklist", "productConsiderations", "potentialConcerns"
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: JSON.stringify(payload),
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2
      }
    });

    const text = response.text;
    
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.customerSnapshot)) throw new Error('Invalid format');
      return parsed;
    } catch (parseError) {
      console.error('Failed to parse or validate LLM response:', text);
      throw new Error('AI returned an invalid response format.');
    }
  } catch (error) {
    console.error('LLM Request Failed:', error.message);
    throw new Error('Counselling preparation could not be generated. Please try again.');
  }
}

/**
 * Generates an explanation for the deterministic limit increase decision.
 */
async function generateLimitIncreaseExplanation(customerName, financialFacts, riskLevel, decisionResult) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing or invalid.');
  }

  const payload = {
    customerName,
    financialFacts,
    riskLevel,
    decisionResult
  };

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
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: JSON.stringify(payload),
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
      if (typeof parsed.summary !== 'string') throw new Error('Invalid format');
      return parsed;
    } catch (parseError) {
      console.error('Failed to parse or validate LLM response:', text);
      throw new Error('AI returned an invalid response format.');
    }
  } catch (error) {
    console.error('LLM Request Failed:', error.message);
    throw new Error('AI explanation could not be generated.');
  }
}

module.exports = {
  generateCreditBrief,
  generateCounsellingPrep,
  generateLimitIncreaseExplanation
};
