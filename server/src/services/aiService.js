const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '4000', 10);

/**
 * Tokenizes a string into a set of lowercased alphanumeric words.
 */
function tokenize(text) {
  if (!text) return new Set();
  const words = text.toLowerCase().match(/[a-z0-9_]+/g) || [];
  return new Set(words);
}

/**
 * Heuristic fallback for text similarity when Python AI microservice is offline.
 * Combines token overlap / Jaccard index with a neutral domain prior.
 */
function computeFallbackSimilarity(textA, textB) {
  const setA = tokenize(textA);
  const setB = tokenize(textB);

  if (setA.size === 0 || setB.size === 0) {
    return 0.5; // neutral default
  }

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) {
      intersection++;
    }
  }

  const union = new Set([...setA, ...setB]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  // Scale between 0.50 (neutral base) and 0.95 for reasonable interview scores
  const score = Math.min(0.95, Math.max(0.40, 0.50 + jaccard * 0.45));
  return Math.round(score * 1000) / 1000;
}

/**
 * Heuristic fallback for concept coverage when Python AI service is unreachable.
 * Checks for substring and token containment in answer text.
 */
function computeFallbackConceptCoverage(answerText, expectedConcepts, threshold = 0.5) {
  const normalizedAnswer = (answerText || '').toLowerCase();
  const answerTokens = tokenize(answerText);
  const covered = [];
  const missed = [];
  const details = [];

  for (const concept of expectedConcepts) {
    const conceptLower = concept.toLowerCase();
    const conceptTokens = tokenize(concept);

    let isMatch = false;
    let similarity = 0.35;

    // Direct substring match
    if (normalizedAnswer.includes(conceptLower)) {
      isMatch = true;
      similarity = 0.85;
    } else {
      // Check token overlap
      let matches = 0;
      for (const tok of conceptTokens) {
        if (answerTokens.has(tok)) matches++;
      }
      if (conceptTokens.size > 0 && matches / conceptTokens.size >= 0.5) {
        isMatch = true;
        similarity = 0.70;
      }
    }

    if (isMatch) {
      covered.push(concept);
    } else {
      missed.push(concept);
    }

    details.push({
      concept,
      similarity,
      covered: isMatch,
    });
  }

  const coveragePct = expectedConcepts.length > 0
    ? Math.round((covered.length / expectedConcepts.length) * 10000) / 100
    : 100.0;

  return {
    coveragePercentage: coveragePct,
    coveredConcepts: covered,
    missedConcepts: missed,
    details,
    isFallback: true,
  };
}

/**
 * Calls Python FastAPI microservice to compute cosine similarity between two texts.
 * Returns similarity bounded in [0.0, 1.0].
 */
async function computeSimilarity(textA, textB) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/embed-similarity`,
      { textA, textB },
      { timeout: TIMEOUT_MS }
    );
    return {
      similarity: response.data.similarity,
      isFallback: false,
    };
  } catch (error) {
    console.warn(`[AI Service Warning] /embed-similarity unreachable (${error.message}). Using fallback.`);
    const fallbackSim = computeFallbackSimilarity(textA, textB);
    return {
      similarity: fallbackSim,
      isFallback: true,
      fallbackReason: error.message,
    };
  }
}

/**
 * Evaluates semantic coverage of expected concepts in the answer.
 */
async function evaluateConcepts(answerText, expectedConcepts, threshold = 0.5) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/concept-coverage`,
      { answerText, expectedConcepts, threshold },
      { timeout: TIMEOUT_MS }
    );
    return {
      ...response.data,
      isFallback: false,
    };
  } catch (error) {
    console.warn(`[AI Service Warning] /concept-coverage unreachable (${error.message}). Using fallback.`);
    return computeFallbackConceptCoverage(answerText, expectedConcepts, threshold);
  }
}

module.exports = {
  computeSimilarity,
  evaluateConcepts,
  AI_SERVICE_URL,
};
