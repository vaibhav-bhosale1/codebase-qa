import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from vector_store import get_retriever, collection_exists

# Load environment variables for Groq and LangSmith
load_dotenv()

# Strict system prompt to enforce accuracy and prevent hallucinations
SYSTEM_PROMPT = """You are an expert code assistant helping developers understand
a codebase. You will be given relevant code snippets from the
codebase as context. Answer the user's question based ONLY on
these code snippets. Always mention the specific file name when
referencing code. If the code snippets do not contain enough
information to answer the question, clearly say so — never
make up code or file names. Be concise and technical.

Context:
{context}

Question:
{question}

Answer:"""

def run_query(question: str, repo_id: str) -> dict:
    """
    Retrieves context from Qdrant, builds a prompt, and queries Groq LLaMA 3.
    """
    # 1. Check if collection exists
    if not collection_exists(repo_id):
        raise ValueError(f"Repo '{repo_id}' has not been indexed yet.")

    # 2. Get retriever
    retriever = get_retriever(repo_id, k=5)
    if not retriever:
        raise RuntimeError(f"Failed to initialize retriever for {repo_id}")

    # 3. Initialize ChatGroq
    llm = ChatGroq(
        model="llama3-8b-8192",
        temperature=0.1,
        groq_api_key=os.environ.get("GROQ_API_KEY")
    )

    # 4. Create PromptTemplate
    prompt = PromptTemplate(
        template=SYSTEM_PROMPT,
        input_variables=["context", "question"]
    )

    # 5. Build RetrievalQA chain
    # Note: When using from_chain_type, the combine_docs_chain_kwargs is passed via chain_type_kwargs
    chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt}
    )

    # 6. Run chain
    result = chain.invoke({"query": question})

    # 7. Extract and deduplicate source documents
    source_docs = result.get("source_documents", [])
    deduplicated_sources = []
    seen_files = set()

    for doc in source_docs:
        file_path = doc.metadata.get("source", "unknown")
        if file_path not in seen_files:
            seen_files.add(file_path)
            deduplicated_sources.append({
                "file": file_path,
                "language": doc.metadata.get("language", "unknown"),
                "snippet": doc.page_content[:200]  # First 200 characters of the chunk
            })

    # 8. Return structured response
    return {
        "answer": result.get("result", ""),
        "sources": deduplicated_sources
    }