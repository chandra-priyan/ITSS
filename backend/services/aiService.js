const { GoogleGenAI, Type } = require('@google/genai');

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
 * Retrieves all configured Gemini API keys in priority order:
 * GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3, GEMINI_API_KEY
 */
function getGeminiApiKeys() {
  const keys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY
  ].filter(key => key && typeof key === 'string' && key.trim() !== '');

  return [...new Set(keys)];
}

/**
 * Executes LLM completion using 3 Gemini API keys in a row (failover pipeline).
 * If Key 1 fails, it immediately attempts Key 2, then Key 3.
 */
async function callLLM(systemInstruction, payload, responseSchema, timeoutMs = 25000) {
  const keys = getGeminiApiKeys();
  const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];
  let lastError = null;

  if (keys.length === 0) {
    throw new Error('No Gemini API keys configured (GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3).');
  }

  for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
    const apiKey = keys[keyIdx];
    const keyLabel = `Key ${keyIdx + 1} (${apiKey.substring(0, 8)}...)`;

    for (const model of modelsToTry) {
      try {
        console.log(`[AI Service] Calling Gemini (${model}) via ${keyLabel}...`);
        const aiClient = new GoogleGenAI({ apiKey });

        const response = await withTimeout(aiClient.models.generateContent({
          model,
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
        lastError = err;
        console.warn(`[AI Service] Gemini (${model}) failed via ${keyLabel}:`, err.message);
      }
    }
    console.log(`[AI Service] All model attempts failed via ${keyLabel}. Failing over to next key...`);
  }

  throw new Error(`All Gemini API keys failed. Last error: ${lastError?.message || 'Unknown'}`);
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
    console.error('[G1] AI Request Failed, returning deterministic credit brief fallback:', error.message);
    const revFormatted = typeof financialFacts?.revenue === 'number' ? `₹${financialFacts.revenue.toLocaleString('en-IN')}` : 'N/A';
    const profitFormatted = typeof financialFacts?.netProfit === 'number' ? `₹${financialFacts.netProfit.toLocaleString('en-IN')}` : 'N/A';
    return {
      summary: `Risk assessment brief for ${customerName}. Evaluated risk profile is ${riskLevel} with a risk score of ${riskScore}. Financial position shows annual revenue of ${revFormatted} and net profit of ${profitFormatted}.`,
      keyFindings: [
        `Risk classification is ${riskLevel} with calculated risk score ${riskScore}.`,
        `Annual revenue: ${revFormatted}.`,
        `Net profit: ${profitFormatted}.`,
        `Key risk drivers: ${Array.isArray(riskFactors) ? riskFactors.join(', ') : 'Standard risk profile'}.`
      ],
      openQuestions: [
        "What is the projected revenue growth and cash flow outlook for the next quarter?",
        "Are there any pending debt commitments or major capital expenditures?",
        "Can the customer provide updated audited financial statements?"
      ],
      recommendedActions: [
        "Schedule a formal review discussion with the relationship management team.",
        "Verify bank statement credits and collateral valuation metrics."
      ]
    };
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
    console.error('[G2] AI Request Failed, returning deterministic counselling prep fallback:', error.message);
    const name = customerFacts?.name || 'Customer';
    return {
      customerSnapshot: [
        `Customer Name: ${name}`,
        `Monthly Income: ${customerFacts?.monthlyIncome ? '₹' + customerFacts.monthlyIncome.toLocaleString('en-IN') : 'N/A'}`,
        `Employment Type: ${customerFacts?.employmentType || 'Self-Employed / Salaried'}`
      ],
      talkingPoints: [
        "Discuss current loan eligibility criteria and product options.",
        "Review credit score requirements and debt-to-income ratio guidelines."
      ],
      questionsToAsk: [
        "What is the target loan amount and requested tenure?",
        "Are there secondary sources of income or co-applicants?"
      ],
      documentChecklist: [
        "Government ID (PAN / Aadhaar)",
        "Latest 6 Months Bank Statements",
        "Last 2 Years Income Tax Returns / Salary Slips"
      ],
      productConsiderations: [
        "Personal Loan / Business Facility",
        "Secured Loan against Property / Collateral"
      ],
      potentialConcerns: [
        "High existing EMI obligations relative to monthly income.",
        "Pending document verification or CKYC status."
      ]
    };
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
    console.error('[G4] AI Request Failed, returning deterministic limit increase fallback:', error.message);
    const decision = decisionResult?.decision || 'HOLD_OFF';
    return {
      summary: `Limit increase decision evaluated as ${decision} for ${customerName} based on financial facts and risk level (${riskLevel}).`,
      reasoning: [
        `Risk level: ${riskLevel}.`,
        `Decision determined by rule engine: ${decision}.`,
        `Current credit metrics evaluated.`
      ],
      conditions: decisionResult?.conditions || ["Verify recent 3-month account credits.", "Confirm zero defaults."],
      openQuestions: [
        "Can the customer provide collateral or a guarantor?",
        "Has the account maintained minimum average quarterly balance?"
      ],
      recommendedNextSteps: [
        "Review request with Credit Officer.",
        "Obtain updated income proofs."
      ]
    };
  }
}

module.exports = {
  generateCreditBrief,
  generateCounsellingPrep,
  generateLimitIncreaseExplanation
};


