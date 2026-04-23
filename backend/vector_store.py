import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance
from langchain_qdrant import QdrantVectorStore
from langchain_cohere import CohereEmbeddings

# Load environment variables
load_dotenv()

# Module-level singletons to prevent re-initializing connections
try:
    client = QdrantClient(
        url=os.environ.get("QDRANT_URL"),
        api_key=os.environ.get("QDRANT_API_KEY")
    )

    embeddings = CohereEmbeddings(
        model="embed-english-light-v3.0",
        cohere_api_key=os.environ.get("COHERE_API_KEY")
    )
except Exception as e:
    print(f"Critical Error initializing vector store clients: {e}")
    client = None
    embeddings = None


def get_embeddings() -> CohereEmbeddings:
    """Returns the cached module-level embeddings instance."""
    return embeddings


def get_vectorstore(collection_name: str) -> QdrantVectorStore:
    """Returns a LangChain QdrantVectorStore for an existing collection."""
    try:
        return QdrantVectorStore(
            client=client,
            collection_name=collection_name,
            embedding=embeddings
        )
    except Exception as e:
        print(f"Error getting vector store for {collection_name}: {e}")
        return None


def create_collection(collection_name: str) -> bool:
    """
    Creates a new Qdrant collection with vector size 384 (for Cohere light) 
    and Distance.COSINE similarity.
    """
    try:
        if collection_exists(collection_name):
            print(f"Collection {collection_name} already exists.")
            return False

        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )
        return True
    except Exception as e:
        print(f"Error creating collection {collection_name}: {e}")
        return False


def get_retriever(collection_name: str, k: int = 5):
    """
    Returns a LangChain retriever that fetches the top-k chunks
    from the specified Qdrant collection.
    """
    try:
        vector_store = get_vectorstore(collection_name)
        if vector_store:
            return vector_store.as_retriever(search_kwargs={"k": k})
        return None
    except Exception as e:
        print(f"Error getting retriever for {collection_name}: {e}")
        return None


def collection_exists(collection_name: str) -> bool:
    """Checks if a collection exists in Qdrant cloud."""
    try:
        return client.collection_exists(collection_name)
    except Exception as e:
        print(f"Error checking if collection exists: {e}")
        return False


def list_collections() -> list[str]:
    """Returns names of all collections in Qdrant cloud."""
    try:
        response = client.get_collections()
        return [collection.name for collection in response.collections]
    except Exception as e:
        print(f"Error listing collections: {e}")
        return []


def delete_collection(collection_name: str) -> bool:
    """Deletes a collection."""
    try:
        client.delete_collection(collection_name)
        return True
    except Exception as e:
        print(f"Error deleting collection {collection_name}: {e}")
        return False