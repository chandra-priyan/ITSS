# AI-powered Banking Relationship Manager Decision Support Platform

## Project Overview
An end-to-end AI-powered Banking Relationship Manager Decision Support Platform designed to augment RMs with automated financial analysis, conversational insights, document extraction, and limit increase decisioning.

## Modules
* **G1 — Credit Exposure AI Brief**: Explains deterministic risk factors and financial metrics to the RM in a clear, digestible brief.
* **G2 — Loan Counselling Prep Assistant**: Uses RAG (Retrieval-Augmented Generation) against a product knowledge base to help an RM prepare for client meetings.
* **G3 — Loan Document Intelligence**: Uses Tesseract OCR and Gemini to automatically parse and extract structured facts (like income and existing liabilities) from uploaded PDFs, DOCXs, and images.
* **G4 — Limit Increase Ask Assistant**: Employs a deterministic, transparent rule engine to decide whether to ASK, ASK WITH CONDITIONS, or HOLD OFF on a credit limit increase, with Gemini explaining the decision.

## AI Concepts
* Generative AI / LLM
* RAG (Retrieval-Augmented Generation)
* NLP
* OCR (Optical Character Recognition)
* Information Extraction
* Risk Scoring
* Rule-Based Decision Engine
* Classification
* Recommendation
* Explainable AI
* Structured Output

## Technology
* **Frontend**: React, Vite
* **Backend**: Node.js, Express
* **Database**: MongoDB
* **AI Models**: Google Gemini (gemini-flash-latest), Gemini Embeddings (text-embedding-004)
* **File Processing**: Tesseract.js (OCR), pdf-parse, mammoth

## Setup

Clone the repository:
```bash
git clone https://github.com/chandra-priyan/ITSS.git
cd ITSS
```

### Frontend Configuration & Run
Create a `.env` file in the `frontend` folder using `frontend/.env.example` as a template:
```env
VITE_API_BASE_URL=http://localhost:3001
```

Install and run:
```bash
cd frontend
npm install
npm run dev
```

### Backend Configuration & Run
Create a `.env` file in the `backend` folder using `backend/.env.example` as a template:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/meridian_banking
GEMINI_API_KEY=your_google_gemini_api_key_here
FRONTEND_URL=http://localhost:5173
```

Install and run:
```bash
cd backend
npm install
npm start
```
