import os
import shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

# Custom module imports
from ingest import ingest_repo
from query import run_query
from vector_store import list_collections, delete_collection
from utils import sanitize_repo_id

# Load environment variables
load_dotenv()

# App setup
app = FastAPI(title="Codebase Q&A API")

# CORS setup for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temp upload directory (Render friendly)
UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Pydantic Models
class QueryRequest(BaseModel):
    question: str
    repo_id: str

class QueryResponse(BaseModel):
    answer: str
    sources: list[dict]

class IngestResponse(BaseModel):
    status: str
    chunks_created: int
    files_indexed: int
    repo_id: str


# Routes
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Codebase Q&A API running"}


@app.get("/repos")
def get_repos():
    try:
        repos = list_collections()
        return {"repos": repos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching repos: {str(e)}")


@app.post("/ingest", response_model=IngestResponse)
async def ingest_repository(file: UploadFile = File(...)):
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files are supported.")

    repo_id = sanitize_repo_id(file.filename.replace(".zip", ""))
    zip_path = os.path.join(UPLOAD_DIR, f"{repo_id}.zip")

    try:
        # Save uploaded zip to temp directory
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process the repository
        result = ingest_repo(zip_path, repo_id)
        
        return IngestResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error indexing repository: {str(e)}")
        
    finally:
        # Always clean up the temporary zip file, even if indexing fails
        if os.path.exists(zip_path):
            os.remove(zip_path)


@app.post("/query", response_model=QueryResponse)
def query_repository(request: QueryRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    if not request.repo_id.strip():
        raise HTTPException(status_code=400, detail="Repo ID cannot be empty.")

    try:
        result = run_query(request.question, request.repo_id)
        return QueryResponse(**result)
    except ValueError as e:
        # Collection does not exist
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying repository: {str(e)}")


@app.delete("/repos/{repo_id}")
def delete_repo(repo_id: str):
    success = delete_collection(repo_id)
    if success:
        return {"status": "deleted", "repo_id": repo_id}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to delete {repo_id}")


# Execution
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)