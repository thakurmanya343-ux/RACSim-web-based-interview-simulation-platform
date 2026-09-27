const express = require('express');
const router = express.Router();
const { questions } = require('../db');

/**
 * GET /api/questions?stage=&domain=
 * Filtered question bank by stage (IceBreaking, ProjectDiscussion, BasicTechnical, AdvancedTechnical, Managerial)
 * and/or domain.
 */
router.get('/', (req, res) => {
  try {
    const { stage, domain } = req.query;
    const list = questions.getAll({ stage, domain });
    res.json({
      success: true,
      count: list.length,
      filter: { stage: stage || null, domain: domain || null },
      data: list,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/questions/recommend?candidateId=&stage=&difficulty=&limit=
 * Recommends optimal questions tailored to candidate's skills and interview stage.
 */
router.get('/recommend', (req, res) => {
  try {
    const { candidateId = 'cand-001', stage, difficulty, limit = 5 } = req.query;
    const { candidates } = require('../db');
    const candidate = candidates.getById(candidateId);
    const candidateSkills = (candidate?.skills || []).map((s) => s.toLowerCase());

    let all = questions.getAll({ stage });
    if (difficulty) {
      all = all.filter((q) => q.difficulty === parseInt(difficulty, 10));
    }

    const scored = all.map((q) => {
      let score = 0;
      const qText = (q.text + ' ' + (q.expectedConcepts || []).join(' ')).toLowerCase();
      for (const sk of candidateSkills) {
        if (qText.includes(sk)) score += 2;
      }
      return { ...q, matchScore: score };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    const top = scored.slice(0, parseInt(limit, 10));

    res.json({
      success: true,
      count: top.length,
      candidateId,
      data: top,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/questions/:id
 * Retrieve a specific question.
 */
router.get('/:id', (req, res) => {
  try {
    const q = questions.getById(req.params.id);
    if (!q) {
      return res.status(404).json({ success: false, error: `Question '${req.params.id}' not found.` });
    }
    res.json({
      success: true,
      data: q,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
