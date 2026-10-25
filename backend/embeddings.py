"""
embeddings.py — Sentence Transformer Embedding Generator
=========================================================
Loads the all-MiniLM-L6-v2 model once and provides a simple function
to generate 384-dimensional embedding vectors from text.

Why this model?
- Free (runs locally, no API cost)
- Fast (< 10ms per embedding on CPU)
- Produces 384-dim vectors (small enough for efficient storage)
- Good quality for semantic similarity in English text
"""

from threading import Lock

_model = None
_model_lock = Lock()


def _get_model():
    """Load the embedding model on first use, not while the API is starting."""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from sentence_transformers import SentenceTransformer

                print("[INFO] Loading sentence-transformer model (all-MiniLM-L6-v2)...")
                _model = SentenceTransformer("all-MiniLM-L6-v2")
                print("[SUCCESS] Embedding model loaded successfully.")
    return _model


def generate_embedding(text: str) -> list[float]:
    """
    Generate a 384-dimensional embedding vector for the given text.
    
    Args:
        text: The input string to embed (e.g., a lead summary or user question)
    
    Returns:
        A list of 384 floats representing the semantic meaning of the text.
        This list can be directly inserted into a pgvector column.
    """
    # model.encode() returns a numpy array; .tolist() converts it to a
    # plain Python list of floats, which is JSON-serializable and compatible
    # with the Supabase client's insert/RPC calls.
    embedding = _get_model().encode(text)
    return embedding.tolist()
