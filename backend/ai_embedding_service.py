import os
import sys
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app)

print("[AI Embedding Service] Initializing scikit-learn Cosine Similarity & TF-IDF Vectorizer Engine...")

def compute_similarity_scores(text_a, text_b, candidate_skills=None, required_skills=None):
    if not candidate_skills:
        candidate_skills = []
    if not required_skills:
        required_skills = []

    # If both texts are blank
    if not text_a.strip() or not text_b.strip():
        if not required_skills:
            return 50, "empty_inputs"
        c_set = set(s.lower() for s in candidate_skills)
        r_set = set(s.lower() for s in required_skills)
        overlap = len(c_set.intersection(r_set))
        return int(round((overlap / max(1, len(r_set))) * 100)), "set_overlap"

    try:
        # Build n-gram TF-IDF matrix (1 to 2-grams)
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), token_pattern=r'(?u)\b[\w\+\#\.]+\b')
        tfidf_matrix = vectorizer.fit_transform([text_a, text_b])
        cos_sim = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
        
        # Calculate skill domain alignment
        if required_skills and candidate_skills:
            c_lower = [s.lower() for s in candidate_skills]
            r_lower = [s.lower() for s in required_skills]
            exact_hits = sum(1 for r in r_lower if any(r == c or r in c or c in r for c in c_lower))
            overlap_ratio = exact_hits / max(1, len(r_lower))
            # Balanced domain match: 70% skill coverage + 25% semantic cosine similarity + bonus
            combined_score = (overlap_ratio * 70) + (cos_sim * 25) + (5 if exact_hits > 0 else 0)
        else:
            combined_score = cos_sim * 100
            
        final_score = int(round(max(12, min(98, combined_score))))
        return final_score, "AI Cosine Similarity (TF-IDF & Semantic Embeddings)"
    except Exception as err:
        print(f"Error computing cosine similarity: {err}")
        return 65, "default_cosine_fallback"

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "service": "Shared AI Embedding & Relevance Scoring Microservice",
        "algorithm": "Cosine Similarity (TF-IDF & N-gram Semantic Embeddings)"
    })

@app.route('/api/embed/similarity', methods=['POST'])
def match_similarity():
    data = request.get_json() or {}
    text_a = data.get('textA') or data.get('text_a') or ""
    text_b = data.get('textB') or data.get('text_b') or ""
    candidate_skills = data.get('candidateSkills') or data.get('candidate_skills') or []
    required_skills = data.get('requiredSkills') or data.get('required_skills') or []

    # If text is not directly passed, construct semantic representations
    if not text_a and candidate_skills:
        text_a = f"Candidate profile and technical competencies: {', '.join(candidate_skills)}. Experienced in software engineering and domain applications."
    if not text_b and required_skills:
        text_b = f"Job requirements and key competencies: {', '.join(required_skills)}. Required expertise for this post."

    score, method = compute_similarity_scores(text_a, text_b, candidate_skills, required_skills)
    
    # Calculate detailed overlap
    c_set = set(s.lower() for s in candidate_skills)
    exact_matches = [s for s in required_skills if s.lower() in c_set or any(c in s.lower() or s.lower() in c for c in c_set)]
    missing = [s for s in required_skills if s not in exact_matches]

    return jsonify({
        "success": True,
        "matchScore": score,
        "algorithm": method,
        "exactMatches": exact_matches,
        "missingSkills": missing,
        "candidateSkillCount": len(candidate_skills),
        "requiredSkillCount": len(required_skills)
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    print(f"[AI Embedding Service] Listening on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
