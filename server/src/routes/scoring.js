const express = require('express');
const router = express.Router();
const { candidates, questions, answers, questionRelevanceCache } = require('../db');
const { computeSimilarity, evaluateConcepts } = require('../services/aiService');

/**
 * POST /api/score/question-relevance
 * Body: { candidateId, questionId }
 * Embeds candidate.skills (joined text) and question.text via AI service,
 * returns cosine similarity as a 0-100 relevance score.
 */
router.post('/question-relevance', async (req, res) => {
  try {
    const { candidateId, questionId } = req.body;

    if (!candidateId || !questionId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: 'candidateId' and 'questionId' are required.",
      });
    }

    const candidate = candidates.getById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: `Candidate '${candidateId}' not found.`,
      });
    }

    const question = questions.getById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: `Question '${questionId}' not found.`,
      });
    }

    // Join candidate skills into semantic text
    const skillsText = (candidate.skills || []).join(', ');
    const questionText = question.text;

    // Call AI service to compute cosine similarity
    const simResult = await computeSimilarity(skillsText, questionText);

    // Convert similarity (0.0 - 1.0) to 0 - 100 score
    const relevanceScore = Math.round(simResult.similarity * 10000) / 100;

    // Cache the question relevance score for report generation
    questionRelevanceCache.set(candidateId, questionId, relevanceScore);

    res.json({
      success: true,
      candidateId,
      questionId,
      candidateSkills: candidate.skills,
      questionText,
      relevanceScore,
      isFallback: simResult.isFallback || false,
      fallbackReason: simResult.fallbackReason || null,
    });
  } catch (error) {
    console.error('Error in /api/score/question-relevance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/score/answer-evaluation
 * Body: { questionId, answerText, candidateId?, answerId? }
 * Computes:
 *   a) relevance: cosine similarity between answerText and question.text (0-100)
 *   b) conceptCoverage: semantic similarity for each string in question.expectedConcepts (0-100)
 * Returns: { relevanceScore, conceptCoverageScore, coveredConcepts, missedConcepts, answerId }
 */
router.post('/answer-evaluation', async (req, res) => {
  try {
    const { questionId, answerText, candidateId, answerId } = req.body;

    if (!questionId || typeof answerText !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: 'questionId' and 'answerText' (string) are required.",
      });
    }

    const question = questions.getById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: `Question '${questionId}' not found.`,
      });
    }

    // 1. Compute Answer Relevance (answerText vs question.text)
    const relResult = await computeSimilarity(answerText, question.text);
    const relevanceScore = Math.round(relResult.similarity * 10000) / 100;

    // 2. Compute Concept Coverage
    const coverageResult = await evaluateConcepts(answerText, question.expectedConcepts || [], 0.5);
    const conceptCoverageScore = coverageResult.coveragePercentage;

    let savedAnswer = null;

    // If candidateId or answerId is provided, persist/update the answer record
    if (candidateId || answerId) {
      const targetId = answerId || `ans-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const existing = answerId ? answers.getById(answerId) : answers.getByCandidateAndQuestion(candidateId, questionId);

      const finalId = existing ? existing.id : targetId;
      const targetCandidateId = candidateId || existing?.candidateId || 'unknown';

      savedAnswer = answers.save({
        id: finalId,
        questionId,
        candidateId: targetCandidateId,
        text: answerText,
        aiRelevanceScore: relevanceScore,
        aiConceptCoverageScore: conceptCoverageScore,
        manualScores: existing?.manualScores || {},
        notes: existing?.notes || '',
      });
    }

    res.json({
      success: true,
      questionId,
      answerId: savedAnswer ? savedAnswer.id : answerId || null,
      relevanceScore,
      conceptCoverageScore,
      coveredConcepts: coverageResult.coveredConcepts || [],
      missedConcepts: coverageResult.missedConcepts || [],
      conceptDetails: coverageResult.details || [],
      isFallback: relResult.isFallback || coverageResult.isFallback || false,
    });
  } catch (error) {
    console.error('Error in /api/score/answer-evaluation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
