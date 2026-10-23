"""Baseline NLP feature extractor for conversational responses.

Uses text statistics, filler word detection, vocabulary richness,
and keyword alignment to produce baseline signals for evaluation.
"""

import re
import string

FILLER_WORDS = {
    "um", "uh", "er", "ah", "like", "you know", "sort of", "kind of",
    "basically", "actually", "literally", "honestly", "i mean", "right"
}

POSITIVE_ASSERTIVE_WORDS = {
    "implemented", "designed", "optimized", "architected", "resolved",
    "measured", "achieved", "delivered", "analyzed", "reduced", "increased",
    "engineered", "collaborated", "spearheaded", "tested", "deployed"
}

HEDGING_WORDS = {
    "maybe", "perhaps", "i think", "i guess", "probably", "not sure",
    "might be", "could be", "somewhat", "i suppose"
}


def extract_nlp_features(text: str, question_text: str = "") -> dict:
    """Extract quantitative baseline linguistic signals from an interview response."""
    cleaned = (text or "").strip()
    if not cleaned:
        return {
            "word_count": 0,
            "sentence_count": 0,
            "filler_count": 0,
            "filler_ratio": 0.0,
            "vocabulary_richness": 0.0,
            "assertive_word_count": 0,
            "hedging_word_count": 0,
            "keyword_overlap": 0.0,
            "baseline_clarity_score": 0,
            "baseline_confidence_score": 0,
        }

    # Normalize tokens
    lower_text = cleaned.lower()
    words = re.findall(r"\b[a-z0-9'-]+\b", lower_text)
    total_words = len(words)

    # Sentences
    sentences = [s.strip() for s in re.split(r"[.!?]+", cleaned) if s.strip()]
    sentence_count = max(1, len(sentences))

    # Filler words detection (single words and common two-word phrases)
    filler_count = 0
    for filler in FILLER_WORDS:
        if " " in filler:
            filler_count += lower_text.count(filler)
        else:
            filler_count += sum(1 for w in words if w == filler)

    filler_ratio = round((filler_count / max(1, total_words)) * 100, 2)

    # Vocabulary richness (Unique words / Total words)
    unique_words = len(set(words))
    vocab_richness = round(unique_words / max(1, total_words), 2)

    # Assertive vs Hedging words
    assertive_count = sum(1 for w in words if w in POSITIVE_ASSERTIVE_WORDS)
    hedging_count = 0
    for hedge in HEDGING_WORDS:
        if " " in hedge:
            hedging_count += lower_text.count(hedge)
        else:
            hedging_count += sum(1 for w in words if w == hedge)

    # Keyword overlap with question
    q_words = set(re.findall(r"\b[a-z0-9]{3,}\b", question_text.lower()))
    # Remove stopwords
    common_stops = {"the", "and", "for", "are", "with", "that", "this", "what", "how", "why", "when", "can", "you", "your"}
    q_keywords = q_words - common_stops
    overlap_count = sum(1 for kw in q_keywords if kw in set(words))
    keyword_overlap = round((overlap_count / max(1, len(q_keywords))) * 100, 1) if q_keywords else 50.0

    # Baseline clarity score heuristic (0-100)
    # Penalizes too short (<20 words) or excessive fillers (>5%)
    length_score = min(100, total_words * 2) if total_words < 50 else min(100, 80 + min(20, (total_words - 50) // 5))
    filler_penalty = min(30, filler_count * 5)
    clarity_score = max(20, min(100, int(length_score * 0.7 + (vocab_richness * 100) * 0.3 - filler_penalty)))

    # Baseline confidence score heuristic (0-100)
    confidence_score = max(20, min(100, int(70 + (assertive_count * 5) - (hedging_count * 8) - (filler_count * 4))))

    return {
        "word_count": total_words,
        "sentence_count": sentence_count,
        "filler_count": filler_count,
        "filler_ratio": filler_ratio,
        "vocabulary_richness": vocab_richness,
        "assertive_word_count": assertive_count,
        "hedging_word_count": hedging_count,
        "keyword_overlap": keyword_overlap,
        "baseline_clarity_score": clarity_score,
        "baseline_confidence_score": confidence_score,
    }
