const express = require('express');
const router = express.Router();
const { answers } = require('../db');

/**
 * POST /api/manual-score
 * Body: { answerId, technicalKnowledge, depthCompleteness, communication, consistency, notes }
 * Stores expert's manual ratings (0-100 each) and qualitative notes for that answer.
 */
router.post('/', (req, res) => {
  try {
    const {
      answerId,
      technicalKnowledge,
      depthCompleteness,
      communication,
      consistency,
      notes = '',
    } = req.body;

    if (!answerId) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: 'answerId' is required.",
      });
    }

    const answer = answers.getById(answerId);
    if (!answer) {
      return res.status(404).json({
        success: false,
        error: `Answer with ID '${answerId}' not found. Please submit or evaluate the answer first.`,
      });
    }

    // Helper to validate and bound score 0 - 100
    const parseScore = (score, name) => {
      if (score === undefined || score === null) return 0;
      const num = Number(score);
      if (isNaN(num)) {
        throw new Error(`Score '${name}' must be a valid number.`);
      }
      return Math.max(0, Math.min(100, Math.round(num * 100) / 100));
    };

    const manualScores = {
      technicalKnowledge: parseScore(technicalKnowledge, 'technicalKnowledge'),
      depthCompleteness: parseScore(depthCompleteness, 'depthCompleteness'),
      communication: parseScore(communication, 'communication'),
      consistency: parseScore(consistency, 'consistency'),
    };

    const updated = answers.updateManualScore(answerId, {
      manualScores,
      notes: typeof notes === 'string' ? notes.trim() : '',
    });

    res.json({
      success: true,
      message: 'Manual score recorded successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('Error in /api/manual-score:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
