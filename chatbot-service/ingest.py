import os
import pandas as pd
import chromadb
from google import genai
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
import time

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
DATASET_DIR = "../dataset"
CHROMA_DB_PATH = "./chroma_db"

if not GEMINI_API_KEY:
    # Try to load from backend .env if not set in environment
    from dotenv import load_dotenv
    load_dotenv("../backend/.env")
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is missing.")

class GeminiEmbeddingFunction(EmbeddingFunction):
    def __init__(self, api_key):
        self.client = genai.Client(api_key=api_key)
        
    def __call__(self, input: Documents) -> Embeddings:
        embeddings = []
        # Process in batches of 10 to respect API limits
        batch_size = 10
        for i in range(0, len(input), batch_size):
            batch = input[i:i+batch_size]
            success = False
            while not success:
                try:
                    res = self.client.models.embed_content(
                        model="gemini-embedding-001",
                        contents=batch
                    )
                    # res.embeddings is a list of objects with a .values attribute
                    embeddings.extend([e.values for e in res.embeddings])
                    success = True
                    time.sleep(1)
                except Exception as e:
                    if "429" in str(e):
                        print("Rate limited. Sleeping for 15s...")
                        time.sleep(15)
                    else:
                        raise e
        return embeddings

def process_customers():
    df = pd.read_csv(os.path.join(DATASET_DIR, "customers.csv"))
    documents = []
    ids = []
    metadatas = []
    
    for index, row in df.iterrows():
        doc = f"Customer Profile: {row['name_1']} (ID: {row['customer_id']}) residing at {row['street']}, {row['town_country']}. Their employment type is {row['employment_type']} with a monthly income of INR {row['monthly_income']}. Date of birth is {row['date_of_birth']}. KYC Status: {row['kyc_status']}."
        documents.append(doc)
        ids.append(f"customer_{row['customer_id']}")
        metadatas.append({"source": "customers.csv", "type": "customer", "customer_id": str(row['customer_id'])})
        
    return documents, ids, metadatas

def process_loans():
    df = pd.read_csv(os.path.join(DATASET_DIR, "loans.csv"))
    documents = []
    ids = []
    metadatas = []
    
    for index, row in df.iterrows():
        doc = f"Loan Record: Customer ID {row['customer_id']} has a {row['product']} loan (Account: {row['loan_id']}) opened on {row['start_date']}. Original amount was {row['currency']} {row['sanctioned_amount']}, current outstanding is {row['currency']} {row['outstanding']}. Tenure is {row['tenure_months']} months at {row['interest_rate']}% interest rate. Status: {row['status']}. Days past due: {row['days_past_due']}."
        documents.append(doc)
        ids.append(f"loan_{row['loan_id']}")
        metadatas.append({"source": "loans.csv", "type": "loan", "customer_id": str(row['customer_id'])})
        
    return documents, ids, metadatas

def process_limits_collateral():
    df = pd.read_csv(os.path.join(DATASET_DIR, "limits_collateral.csv"))
    documents = []
    ids = []
    metadatas = []
    
    for index, row in df.iterrows():
        doc = f"Limit & Collateral Record: Customer ID {row['customer_id']} has a {row['limit_product']} credit limit (Facility: {row['limit_id']}) of {row['currency']} {row['approved_limit']}. Utilized amount is {row['currency']} {row['utilized']}, available is {row['currency']} {row['available']}. "
        if pd.notna(row['collateral_id']):
            doc += f"This facility is backed by a {row['collateral_type']} collateral (ID: {row['collateral_id']}) valued at {row['currency']} {row['collateral_value']}."
        else:
            doc += "This facility is unsecured (no collateral)."
            
        documents.append(doc)
        ids.append(f"limit_{row['limit_id']}")
        metadatas.append({"source": "limits_collateral.csv", "type": "limit", "customer_id": str(row['customer_id'])})
        
    return documents, ids, metadatas

def main():
    print("Initializing ChromaDB...")
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    
    # Use our custom Gemini embedding function
    embedding_func = GeminiEmbeddingFunction(GEMINI_API_KEY)
    
    # Create or get collection
    collection = client.get_or_create_collection(
        name="banking_dataset",
        embedding_function=embedding_func
    )
    
    print("Processing CSV files...")
    all_docs = []
    all_ids = []
    all_metas = []
    
    docs, ids, metas = process_customers()
    all_docs.extend(docs)
    all_ids.extend(ids)
    all_metas.extend(metas)
    
    docs, ids, metas = process_loans()
    all_docs.extend(docs)
    all_ids.extend(ids)
    all_metas.extend(metas)
    
    docs, ids, metas = process_limits_collateral()
    all_docs.extend(docs)
    all_ids.extend(ids)
    all_metas.extend(metas)
    
    print(f"Ingesting {len(all_docs)} records into ChromaDB (this may take a minute depending on rate limits)...")
    
    # Batch ingestion to avoid rate limits
    batch_size = 10
    for i in range(0, len(all_docs), batch_size):
        end_idx = min(i + batch_size, len(all_docs))
        print(f"Upserting batch {i} to {end_idx}...")
        collection.upsert(
            documents=all_docs[i:end_idx],
            ids=all_ids[i:end_idx],
            metadatas=all_metas[i:end_idx]
        )
        
    print("Ingestion complete!")

if __name__ == "__main__":
    main()
