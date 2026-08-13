from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
import google.generativeai as genai
import os

from ingest import GeminiEmbeddingFunction, CHROMA_DB_PATH

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    from dotenv import load_dotenv
    load_dotenv("../backend/.env")
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is missing.")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize ChromaDB
try:
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    collection = client.get_collection(
        name="banking_dataset",
        embedding_function=GeminiEmbeddingFunction()
    )
except Exception as e:
    print(f"Warning: Could not load ChromaDB. Did you run ingest.py? Error: {e}")
    collection = None

app = FastAPI()

# Allow requests from the Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to Node.js backend IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    history: list[dict] = []

class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not collection:
        raise HTTPException(status_code=500, detail="Vector database not initialized. Run ingest.py first.")
        
    try:
        # 1. Build a search query that includes recent context for better retrieval
        search_query = request.query
        if request.history:
            # Append the last user question and assistant answer to give ChromaDB context
            recent_history = [msg.get("content", "") for msg in request.history[-2:]]
            search_query = " ".join(recent_history) + " " + request.query
            
        # 2. Retrieve relevant chunks
        results = collection.query(
            query_texts=[search_query],
            n_results=7
        )
        
        retrieved_docs = results['documents'][0]
        retrieved_metadatas = results['metadatas'][0]
        
        # 2. Build context
        context_parts = []
        sources = []
        for doc, meta in zip(retrieved_docs, retrieved_metadatas):
            context_parts.append(doc)
            sources.append(meta)
            
        context_str = "\n\n".join(context_parts)
        
        # Format history
        history_str = ""
        if request.history:
            history_str = "CONVERSATION HISTORY:\n"
            for msg in request.history:
                role = "User" if msg.get("role") == "user" else "Assistant"
                history_str += f"{role}: {msg.get('content')}\n"
            history_str += "\n"
        
        # 3. Prompt Gemini LLM
        prompt = f"""You are an AI Banking Assistant for a Relationship Manager. 
Answer the user's question using ONLY the provided context from the bank's database.
If the answer is not in the context, say "I cannot find the answer to that in the database."
Do not invent information.

CONTEXT:
{context_str}

{history_str}QUESTION:
{request.query}

ANSWER:"""

        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        
        # Deduplicate sources based on customer_id + source file for cleaner UI
        unique_sources = []
        seen = set()
        for s in sources:
            key = f"{s.get('customer_id')}_{s.get('source')}"
            if key not in seen:
                seen.add(key)
                unique_sources.append(s)

        return ChatResponse(
            answer=response.text,
            sources=unique_sources
        )

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Chat error: {error_trace}")
        raise HTTPException(status_code=500, detail=error_trace)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
