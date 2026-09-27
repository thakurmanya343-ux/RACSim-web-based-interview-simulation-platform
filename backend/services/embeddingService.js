const http = require('http');

const AI_EMBEDDING_URL = process.env.AI_EMBEDDING_URL || 'http://localhost:5050/api/embed/similarity';

/**
 * Fallback set-overlap similarity calculation
 */
function calculateFallbackOverlap(candidateSkills = [], requiredSkills = []) {
  if (!requiredSkills || requiredSkills.length === 0) return 60;
  if (!candidateSkills || candidateSkills.length === 0) return 15;

  const candidateLower = candidateSkills.map(s => s.toLowerCase().trim());
  const requiredLower = requiredSkills.map(s => s.toLowerCase().trim());

  let matches = 0;
  const matchedList = [];
  const missingList = [];

  for (const req of requiredSkills) {
    const rLower = req.toLowerCase().trim();
    // Check exact or partial containment
    const found = candidateLower.some(c => c === rLower || c.includes(rLower) || rLower.includes(c));
    if (found) {
      matches++;
      matchedList.push(req);
    } else {
      missingList.push(req);
    }
  }

  // Calculate percentage
  const ratio = matches / requiredSkills.length;
  // Scale between 15% and 98%
  let score = Math.round(ratio * 95);
  if (matches > 0 && score < 25) score = 25;
  if (matches === 0) score = 12;

  return {
    matchScore: score,
    algorithm: 'Set Overlap Fallback Algorithm',
    exactMatches: matchedList,
    missingSkills: missingList
  };
}

/**
 * Call the shared AI embedding service
 */
async function callSharedAiEmbeddingService(candidateSkills, requiredSkills, vacancyTitle = '') {
  const payload = JSON.stringify({
    textA: `Candidate skills: ${candidateSkills.join(', ')}. Domain expertise and technical background.`,
    textB: `Job requirement for ${vacancyTitle}: ${requiredSkills.join(', ')}. Key technical competencies.`,
    candidateSkills: candidateSkills,
    requiredSkills: requiredSkills
  });

  const parsedUrl = new URL(AI_EMBEDDING_URL);

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 2500 // Fast 2.5s timeout
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const data = JSON.parse(body);
            resolve(data);
          } else {
            reject(new Error(`Embedding service returned HTTP ${res.statusCode}: ${body}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Embedding service request timed out'));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Compute match score for a vacancy against candidate skills
 */
async function computeVacancyMatch(candidateSkills, vacancy) {
  try {
    const aiResult = await callSharedAiEmbeddingService(
      candidateSkills,
      vacancy.requiredSkills,
      vacancy.title
    );
    return {
      matchScore: aiResult.matchScore,
      algorithm: aiResult.algorithm || 'Shared AI Embedding (Cosine Similarity)',
      exactMatches: aiResult.exactMatches || [],
      missingSkills: aiResult.missingSkills || [],
      isAiPowered: true
    };
  } catch (error) {
    // Graceful fallback to set-overlap
    const fallback = calculateFallbackOverlap(candidateSkills, vacancy.requiredSkills);
    return {
      ...fallback,
      isAiPowered: false,
      note: 'Calculated via local skill-overlap heuristic (AI service offline)'
    };
  }
}

module.exports = {
  computeVacancyMatch,
  calculateFallbackOverlap
};
