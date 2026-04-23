import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

from ingest import ingest_zip, ingest_github_url
from query import run_query
from vector_store import list_collections, delete_collection
from utils import sanitize_repo_id

load_dotenv()

app = FastAPI(title="Codebase Q&A API")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Pydantic Models
class QueryRequest(BaseModel):
    question: str
    repo_id: str

class GithubIngestRequest(BaseModel):
    url: str

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
        return {"repos": list_collections()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching repos: {str(e)}")

@app.post("/ingest/zip", response_model=IngestResponse)
async def ingest_zip_route(file: UploadFile = File(...)):
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files are supported.")

    repo_id = sanitize_repo_id(file.filename.replace(".zip", ""))
    zip_path = os.path.join(UPLOAD_DIR, f"{repo_id}.zip")

    try:
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        result = ingest_zip(zip_path, repo_id)
        return IngestResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error indexing zip: {str(e)}")
    finally:
        if os.path.exists(zip_path):
            os.remove(zip_path)

@app.post("/ingest/github", response_model=IngestResponse)
def ingest_github_route(request: GithubIngestRequest):
    if not request.url.startswith("https://github.com/"):
        raise HTTPException(status_code=400, detail="Must be a valid GitHub URL.")
    
    # Extract repo name from URL (e.g., https://github.com/user/repo -> repo)
    repo_name = request.url.rstrip("/").split("/")[-1]
    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]
        
    repo_id = sanitize_repo_id(repo_name)

    try:
        result = ingest_github_url(request.url, repo_id)
        return IngestResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error indexing GitHub repo: {str(e)}")

@app.post("/query", response_model=QueryResponse)
def query_repository(request: QueryRequest):
    if not request.question.strip() or not request.repo_id.strip():
        raise HTTPException(status_code=400, detail="Question and Repo ID cannot be empty.")
    try:
        return QueryResponse(**run_query(request.question, request.repo_id))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying: {str(e)}")

@app.delete("/repos/{repo_id}")
def delete_repo(repo_id: str):
    if delete_collection(repo_id):
        return {"status": "deleted", "repo_id": repo_id}
    raise HTTPException(status_code=500, detail=f"Failed to delete {repo_id}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)