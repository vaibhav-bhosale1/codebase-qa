import os
import tempfile
import zipfile
import shutil
import time
import git
from langchain_text_splitters import RecursiveCharacterTextSplitter, Language
from langchain_core.documents import Document

from utils import get_file_language, is_valid_source_file, should_skip_folder
from vector_store import create_collection, get_vectorstore

# Map our custom string language names to LangChain's Language enum
LANGCHAIN_LANGUAGES = {
    "python": Language.PYTHON,
    "javascript": Language.JS,
    "typescript": Language.TS,
    "java": Language.JAVA,
    "cpp": Language.CPP,
    "go": Language.GO,
    "rust": Language.RUST
}

def _process_directory(source_dir: str, repo_id: str) -> dict:
    """Core logic to walk a directory, chunk files, and upload to Qdrant."""
    all_chunks = []
    files_indexed = 0

    # First pass: Gather all valid files
    files_to_process = []
    for root, dirs, files in os.walk(source_dir):
        # Modify dirs in-place to skip hidden folders like .git entirely during os.walk
        dirs[:] = [d for d in dirs if not should_skip_folder(d)]
        
        for file in files:
            file_path = os.path.join(root, file)
            rel_file_path = os.path.relpath(file_path, source_dir)

            # Check valid extension
            if not is_valid_source_file(file):
                continue

            # Skip files larger than 300KB
            if os.path.getsize(file_path) > 300 * 1024:
                continue
            
            files_to_process.append((file_path, rel_file_path, file))

    total_files = len(files_to_process)

    # Second pass: Process the filtered files
    for idx, (file_path, rel_file_path, filename) in enumerate(files_to_process, 1):
        print(f"Processing file {idx}/{total_files}: {rel_file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            if len(content.strip()) < 10:
                continue

            lang_str = get_file_language(filename)
            metadata = {"source": rel_file_path, "language": lang_str, "repo_id": repo_id}

            if lang_str in LANGCHAIN_LANGUAGES:
                splitter = RecursiveCharacterTextSplitter.from_language(
                    language=LANGCHAIN_LANGUAGES[lang_str], chunk_size=500, chunk_overlap=80
                )
            else:
                splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80)

            docs = splitter.create_documents([content], metadatas=[metadata])
            all_chunks.extend(docs)
            files_indexed += 1

        except UnicodeDecodeError:
            pass # Silently skip non-text files that slipped through
        except Exception as e:
            print(f"  -> Error processing {rel_file_path}: {e}")

    # Batch upload to Qdrant
    vectorstore = get_vectorstore(repo_id)
    if vectorstore and all_chunks:
        total_batches = (len(all_chunks) + 49) // 50
        for i in range(0, len(all_chunks), 50):
            batch = all_chunks[i:i+50]
            vectorstore.add_documents(batch)
            print(f"Uploaded batch {(i//50) + 1}/{total_batches} ({len(batch)} chunks)")
            time.sleep(0.5) # Prevent Cohere rate limits

    return {
        "status": "success",
        "chunks_created": len(all_chunks),
        "files_indexed": files_indexed,
        "repo_id": repo_id
    }


def ingest_zip(zip_path: str, repo_id: str) -> dict:
    """Extracts a zip and processes it."""
    create_collection(repo_id)
    temp_dir = tempfile.mkdtemp()
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
        return _process_directory(temp_dir, repo_id)
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def ingest_github_url(repo_url: str, repo_id: str) -> dict:
    """Clones a github repo (shallow clone) and processes it."""
    create_collection(repo_id)
    temp_dir = tempfile.mkdtemp()
    try:
        print(f"Cloning {repo_url}...")
        # depth=1 makes it a shallow clone (super fast, no commit history)
        git.Repo.clone_from(repo_url, temp_dir, depth=1) 
        return _process_directory(temp_dir, repo_id)
    except Exception as e:
        print(f"Error cloning repo: {e}")
        raise
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)