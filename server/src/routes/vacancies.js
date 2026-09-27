const express = require('express');
const router = express.Router();
const { posts } = require('../db');
const { computeSimilarity } = require('../services/aiService');

// Fallback skill overlap calculation
function calculateFallbackOverlap(candidateSkills = [], requiredSkills = []) {
  if (!requiredSkills || requiredSkills.length === 0) return 60;
  if (!candidateSkills || candidateSkills.length === 0) return 15;

  const candidateLower = candidateSkills.map(s => s.toLowerCase().trim());
  let matches = 0;
  const matchedList = [];
  const missingList = [];

  for (const req of requiredSkills) {
    const rLower = req.toLowerCase().trim();
    const found = candidateLower.some(c => c === rLower || c.includes(rLower) || rLower.includes(c));
    if (found) {
      matches++;
      matchedList.push(req);
    } else {
      missingList.push(req);
    }
  }

  const ratio = matches / requiredSkills.length;
  let score = Math.round(ratio * 95);
  if (matches > 0 && score < 25) score = 25;
  if (matches === 0) score = 12;

  return {
    matchScore: score,
    algorithm: 'Set Overlap Heuristic Fallback',
    exactMatches: matchedList,
    missingSkills: missingList,
    isAiPowered: false
  };
}

/**
 * GET /api/vacancies
 * List all open vacancies with required skills
 */
router.get('/', (req, res) => {
  try {
    const allPosts = posts.getAll();
    const vacancies = allPosts.map(p => ({
      id: p.id,
      title: p.title,
      domain: p.domain,
      requiredSkills: Array.isArray(p.requiredSkills) ? p.requiredSkills : JSON.parse(p.requiredSkills || '[]'),
      level: p.level || 'Mid-Level',
      location: p.location || 'Bangalore / Hybrid',
      salaryRange: p.salaryRange || '₹14,00,000 - ₹28,00,000 / yr',
      description: p.description || `${p.title} position in the ${p.domain} domain.`
    }));
    res.json(vacancies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve vacancies', details: error.message });
  }
});

/**
 * POST /api/vacancies/match
 * Body: { candidateSkills, vacancyId }
 * Returns match score by calling the shared AI embedding service
 */
router.post('/match', async (req, res) => {
  try {
    const { candidateSkills = [], vacancyId } = req.body;
    const allPosts = posts.getAll().map(p => ({
      ...p,
      requiredSkills: Array.isArray(p.requiredSkills) ? p.requiredSkills : JSON.parse(p.requiredSkills || '[]')
    }));

    // If matching a specific vacancy
    if (vacancyId) {
      const vacancy = allPosts.find(v => v.id === vacancyId);
      if (!vacancy) {
        return res.status(404).json({ error: `Vacancy '${vacancyId}' not found.` });
      }

      let score = 50;
      let isAiPowered = false;
      let algorithm = 'Shared AI Embedding (Cosine Similarity)';

      try {
        const skillsText = candidateSkills.join(', ');
        const reqSkillsText = vacancy.requiredSkills.join(', ');
        const simResult = await computeSimilarity(skillsText, reqSkillsText);
        
        // Calibration combining cosine similarity and skill coverage
        const cLower = candidateSkills.map(s => s.toLowerCase());
        const hits = vacancy.requiredSkills.filter(r => cLower.some(c => c === r.toLowerCase() || c.includes(r.toLowerCase()))).length;
        const coverageRatio = hits / Math.max(1, vacancy.requiredSkills.length);
        
        const combined = (coverageRatio * 0.65 + simResult.similarity * 0.35) * 100;
        score = Math.round(Math.max(15, Math.min(98, combined)));
        isAiPowered = !simResult.isFallback;
        if (simResult.isFallback) {
          algorithm = 'Local Tokenization Fallback';
        }
      } catch (aiErr) {
        const fallback = calculateFallbackOverlap(candidateSkills, vacancy.requiredSkills);
        score = fallback.matchScore;
        algorithm = fallback.algorithm;
      }

      return res.json({
        vacancyId: vacancy.id,
        vacancyTitle: vacancy.title,
        matchScore: score,
        isAiPowered,
        algorithm
      });
    }

    // Match across all vacancies and sort descending
    const scoredVacancies = await Promise.all(
      allPosts.map(async (v) => {
        let score = 50;
        let isAiPowered = false;
        let algorithm = 'Shared AI Embedding (Cosine Similarity)';
        const cLower = candidateSkills.map(s => s.toLowerCase());
        const exactMatches = v.requiredSkills.filter(r => cLower.some(c => c === r.toLowerCase() || c.includes(r.toLowerCase()) || r.toLowerCase().includes(c)));
        const missingSkills = v.requiredSkills.filter(r => !exactMatches.includes(r));

        try {
          const skillsText = candidateSkills.join(', ');
          const reqSkillsText = v.requiredSkills.join(', ');
          const simResult = await computeSimilarity(skillsText, reqSkillsText);

          const coverageRatio = exactMatches.length / Math.max(1, v.requiredSkills.length);
          const combined = (coverageRatio * 0.65 + simResult.similarity * 0.35) * 100;
          score = Math.round(Math.max(15, Math.min(98, combined)));
          isAiPowered = !simResult.isFallback;
          if (simResult.isFallback) {
            algorithm = 'Local Tokenization Fallback';
          }
        } catch (aiErr) {
          const fallback = calculateFallbackOverlap(candidateSkills, v.requiredSkills);
          score = fallback.matchScore;
          algorithm = fallback.algorithm;
        }

        return {
          id: v.id,
          title: v.title,
          domain: v.domain,
          requiredSkills: v.requiredSkills,
          level: v.level || 'Mid-Level',
          location: v.location || 'Bangalore / Hybrid',
          salaryRange: v.salaryRange || '₹14,00,000 - ₹28,00,000 / yr',
          description: v.description || `${v.title} in ${v.domain}`,
          matchScore: score,
          matchAlgorithm: algorithm,
          exactMatches,
          missingSkills,
          isAiPowered
        };
      })
    );

    scoredVacancies.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      scoredVacancies
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to score vacancies', details: error.message });
  }
});

module.exports = router;
