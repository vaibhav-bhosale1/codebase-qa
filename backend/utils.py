import os
import re
import hashlib

# Standardized mappings for our file processor
EXTENSION_MAPPING = {
    ".py": "python", ".js": "javascript", ".ts": "typescript",
    ".jsx": "javascript", ".tsx": "typescript", ".java": "java",
    ".cpp": "cpp", ".c": "c", ".go": "go", ".rs": "rust",
    ".rb": "ruby", ".php": "php", ".cs": "csharp", ".sql": "sql",
    ".html": "html", ".css": "css", ".md": "markdown"
}

SKIP_FOLDERS = {
    "node_modules", ".git", "__pycache__", "dist", "build",
    ".next", "venv", "env", ".env", "coverage", ".idea", ".vscode"
}

def get_file_language(filename: str) -> str:
    """
    Maps a file extension to its programming language name.
    Returns 'unknown' for unrecognized extensions.
    """
    _, ext = os.path.splitext(filename)
    return EXTENSION_MAPPING.get(ext.lower(), "unknown")

def extract_line_range(start_line: int, chunk_size: int) -> str:
    """
    Returns a formatted string representing a line range.
    Assumes chunk_size roughly correlates to the number of lines.
    """
    end_line = start_line + chunk_size - 1
    return f"L{start_line}-L{end_line}"

def sanitize_repo_id(name: str) -> str:
    """
    Converts any string to a valid Qdrant collection name.
    Requirements: lowercase, replace special chars with hyphens,
    no consecutive hyphens, max 63 chars, must start with a letter.
    """
    # Convert to lowercase
    name = name.lower()
    
    # Replace anything that isn't a letter or number with a hyphen
    name = re.sub(r'[^a-z0-9]', '-', name)
    
    # Remove consecutive hyphens
    name = re.sub(r'-+', '-', name)
    
    # Must start with a letter (Qdrant rule). If it starts with a number/hyphen, prepend 'repo-'
    if not re.match(r'^[a-z]', name):
        name = 'repo-' + name.lstrip('-')
        
    # Strip trailing hyphens and enforce the 63 character limit
    name = name.rstrip('-')[:63]
    
    return name

def compute_file_hash(filepath: str) -> str:
    """
    Returns the MD5 hash of a file's contents as a hex string.
    Useful for checking if a file has changed since the last index.
    """
    hash_md5 = hashlib.md5()
    try:
        with open(filepath, "rb") as f:
            # Read in chunks to handle potentially large files efficiently
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    except FileNotFoundError:
        return ""

def is_valid_source_file(filename: str) -> bool:
    """
    Returns True if the file extension is in our supported list.
    """
    _, ext = os.path.splitext(filename)
    return ext.lower() in EXTENSION_MAPPING

def should_skip_folder(folder_name: str) -> bool:
    """
    Returns True if the folder is a common build/environment directory 
    that should not be indexed.
    """
    return folder_name in SKIP_FOLDERS