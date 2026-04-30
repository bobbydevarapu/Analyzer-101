import os

os.environ["TOKENIZERS_PARALLELISM"] = "false"

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from nltk.util import ngrams
from difflib import SequenceMatcher
import torch

torch.set_num_threads(1)

# =========================
# 🔹 MODEL (LAZY LOAD)
# =========================
model = None

def get_model():
    global model
    if model is None:
        print("🚀 Loading model (only once)")
        model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
    return model


# =========================
# 🔹 NEW: PRECOMPUTE EMBEDDINGS
# =========================
def get_embeddings(texts):
    model = get_model()
    return model.encode(texts)


# =========================
# 🔹 TF-IDF
# =========================
def tfidf_similarity(text1, text2):
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform([text1, text2])
    score = cosine_similarity(vectors[0], vectors[1])[0][0]
    return round(score * 100, 2)


# =========================
# 🔹 SEMANTIC (FIXED)
# =========================
def semantic_similarity_from_embeddings(e1, e2):
    score = cosine_similarity([e1], [e2])[0][0]
    return round(score * 100, 2)


# =========================
# 🔹 NGRAM
# =========================
def ngram_similarity(text1, text2, n=3):
    tokens1 = text1.split()
    tokens2 = text2.split()

    ngrams1 = set([" ".join(g) for g in ngrams(tokens1, n)])
    ngrams2 = set([" ".join(g) for g in ngrams(tokens2, n)])

    if not ngrams1 or not ngrams2:
        return 0.0

    intersection = ngrams1 & ngrams2
    union = ngrams1 | ngrams2

    return round((len(intersection) / len(union)) * 100, 2)


# =========================
# 🔹 MATCHED SENTENCES
# =========================
def simple_sentence_split(text):
    return [s.strip() for s in text.split('.') if len(s.strip()) > 5]


def get_matched_sentences(text1, text2):
    sents1 = simple_sentence_split(text1)
    sents2 = simple_sentence_split(text2)

    matches = []

    for s1 in sents1:
        for s2 in sents2:
            if SequenceMatcher(None, s1, s2).ratio() > 0.7:
                if s1 not in matches:
                    matches.append(s1)

    return matches


# =========================
# 🔹 MAIN COMPARE (UPDATED)
# =========================
def compare(text1, text2, emb1, emb2):
    tfidf = tfidf_similarity(text1, text2)
    semantic = semantic_similarity_from_embeddings(emb1, emb2)
    ngram = ngram_similarity(text1, text2)

    length = min(len(text1.split()), len(text2.split()))

    # ✅ SAME LOGIC (UNCHANGED)
    if length < 5:
        final_score = semantic
    elif length < 15:
        final_score = (0.2 * tfidf) + (0.2 * ngram) + (0.6 * semantic)
    else:
        final_score = (0.3 * tfidf) + (0.3 * ngram) + (0.4 * semantic)

    return {
        "tfidf_score": tfidf,
        "semantic_score": semantic,
        "ngram_score": ngram,
        "final_score": round(final_score, 2),
        "matched_sentences": get_matched_sentences(text1, text2),
        "length": length
    }