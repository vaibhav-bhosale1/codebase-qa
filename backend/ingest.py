import os
import tempfile
import zipfile
import shutil
import time
from langchain_text_splitters import RecursiveCharacterTextSplitter, Language
from langchain_core.documents import Document

from utils import get_file_language, is_valid_source_file, should_skip_folder, sanitize_repo_id
from vector_store import create_collection, get_vectorstore, collection_exists

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

def ingest_repo(zip_path: str, repo_id: str) -> dict:
    """
    Extracts a zip file, processes valid source code files, chunks them, 
    and uploads the embeddings to Qdrant in batches.
    """
    # 1. Ensure the collection exists
    create_collection(repo_id)

    # 2. Extract zip to temp directory
    temp_dir = tempfile.mkdtemp()
    all_chunks = []
    files_indexed = 0

    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)

        # First pass: Gather all valid files so we know the total count for logging
        files_to_process = []
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                file_path = os.path.join(root, file)
                rel_file_path = os.path.relpath(file_path, temp_dir)

                # a. Check if any parent folder should be skipped
                skip_file = False
                folder_parts = rel_file_path.split(os.sep)[:-1] # Exclude filename itself
                for part in folder_parts:
                    if should_skip_folder(part):
                        skip_file = True
                        break
                
                if skip_file:
                    continue

                # b. Check valid extension
                if not is_valid_source_file(file):
                    continue

                # c. Skip files larger than 300KB
                if os.path.getsize(file_path) > 300 * 1024:
                    continue
                
                files_to_process.append((file_path, rel_file_path, file))

        total_files = len(files_to_process)

        # Second pass: Process the filtered files
        for idx, (file_path, rel_file_path, filename) in enumerate(files_to_process, 1):
            print(f"Processing file {idx}/{total_files}: {rel_file_path}")
            
            try:
                # d. Read file as UTF-8
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # f. Skip if less than 10 characters
                if len(content.strip()) < 10:
                    continue

                # e. Detect language
                lang_str = get_file_language(filename)
                
                # Setup metadata
                metadata = {
                    "source": rel_file_path,
                    "language": lang_str,
                    "repo_id": repo_id
                }

                # 5. Chunk the file
                if lang_str in LANGCHAIN_LANGUAGES:
                    splitter = RecursiveCharacterTextSplitter.from_language(
                        language=LANGCHAIN_LANGUAGES[lang_str],
                        chunk_size=500,
                        chunk_overlap=80
                    )
                else:
                    splitter = RecursiveCharacterTextSplitter(
                        chunk_size=500,
                        chunk_overlap=80
                    )

                # Create Document objects with metadata attached
                docs = splitter.create_documents([content], metadatas=[metadata])
                all_chunks.extend(docs)
                files_indexed += 1

            except UnicodeDecodeError:
                print(f"  -> Skipped (UnicodeDecodeError): {rel_file_path}")
            except Exception as e:
                print(f"  -> Error processing {rel_file_path}: {e}")

        # 7. Batch upload to Qdrant
        vectorstore = get_vectorstore(repo_id)
        if vectorstore and all_chunks:
            total_batches = (len(all_chunks) + 49) // 50
            for i in range(0, len(all_chunks), 50):
                batch = all_chunks[i:i+50]
                vectorstore.add_documents(batch)
                print(f"Uploaded batch {(i//50) + 1}/{total_batches} ({len(batch)} chunks)")
                # Sleep to prevent Cohere rate limits
                time.sleep(0.5)

        return {
            "status": "success",
            "chunks_created": len(all_chunks),
            "files_indexed": files_indexed,
            "repo_id": repo_id
        }

    finally:
        # 8. Clean up temp directory
        shutil.rmtree(temp_dir, ignore_errors=True)