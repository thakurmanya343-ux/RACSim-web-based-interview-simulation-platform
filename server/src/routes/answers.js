const express = require('express');
const router = express.Router();
const { answers, candidates, questions } = require('../db');

/**
 * POST /api/answers
 * Body: { candidateId, questionId, text }
 * Creates or updates an answer submission.
 */
router.post('/', (req, res) => {
  try {
    const { candidateId, questionId, text } = req.body;

    if (!candidateId || !questionId || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: 'candidateId', 'questionId', and 'text' are required.",
      });
    }

    const candidate = candidates.getById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, error: `Candidate '${candidateId}' not found.` });
    }

    const question = questions.getById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, error: `Question '${questionId}' not found.` });
    }

    const existing = answers.getByCandidateAndQuestion(candidateId, questionId);
    const id = existing ? existing.id : `ans-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const saved = answers.save({
      id,
      questionId,
      candidateId,
      text,
      aiRelevanceScore: existing ? existing.aiRelevanceScore : 0.0,
      aiConceptCoverageScore: existing ? existing.aiConceptCoverageScore : 0.0,
      manualScores: existing ? existing.manualScores : {},
      notes: existing ? existing.notes : '',
    });

    res.json({
      success: true,
      message: 'Answer saved successfully.',
      data: saved,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/answers?candidateId=
 * Lists answers for a given candidate.
 */
router.get('/', (req, res) => {
  try {
    const { candidateId } = req.query;
    if (!candidateId) {
      return res.status(400).json({ success: false, error: "Query parameter 'candidateId' is required." });
    }
    const list = answers.getByCandidate(candidateId);
    res.json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/answers/:id
 * Retrieve a specific answer by ID.
 */
router.get('/:id', (req, res) => {
  try {
    const ans = answers.getById(req.params.id);
    if (!ans) {
      return res.status(404).json({ success: false, error: `Answer '${req.params.id}' not found.` });
    }
    res.json({
      success: true,
      data: ans,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
