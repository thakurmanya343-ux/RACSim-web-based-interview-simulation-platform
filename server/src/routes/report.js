const express = require('express');
const router = express.Router();
const { candidates, posts, questions, answers, questionRelevanceCache, reports } = require('../db');
const { generateInterviewReport } = require('../services/scoringService');
const { computeSimilarity } = require('../services/aiService');

/**
 * POST /api/report/generate
 * Body: { candidateId, postId }
 * Aggregates all answered questions, AI scores, manual expert ratings,
 * computes final weighted percentage using strict weights,
 * and saves/returns the comprehensive report with per-question evidence.
 */
router.post('/generate', async (req, res) => {
  try {
    const { candidateId, postId } = req.body;

    if (!candidateId || !postId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: 'candidateId' and 'postId' are required.",
      });
    }

    const candidate = candidates.getById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: `Candidate '${candidateId}' not found.`,
      });
    }

    const post = posts.getById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: `Post '${postId}' not found.`,
      });
    }

    // Pull all answers submitted by this candidate
    const answersList = answers.getByCandidate(candidateId);

    // Fetch questions to build lookup map
    const allQuestions = questions.getAll();
    const questionsMap = {};
    for (const q of allQuestions) {
      questionsMap[q.id] = q;
    }

    // Pre-calculate question relevance for any answer that isn't cached yet
    const candidateSkillsText = (candidate.skills || []).join(', ');
    for (const ans of answersList) {
      const cached = questionRelevanceCache.get(candidateId, ans.questionId);
      if (!cached) {
        const q = questionsMap[ans.questionId];
        if (q) {
          const simResult = await computeSimilarity(candidateSkillsText, q.text);
          const score = Math.round(simResult.similarity * 10000) / 100;
          questionRelevanceCache.set(candidateId, ans.questionId, score);
        }
      }
    }

    // Generate report data using exact weights
    const reportData = generateInterviewReport({
      candidateId,
      postId,
      candidate,
      answersList,
      questionsMap,
      questionRelevanceCache,
    });

    const reportId = `report-${candidateId}-${postId}`;
    const savedReport = reports.save({
      id: reportId,
      ...reportData,
    });

    res.json({
      success: true,
      data: savedReport,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/report/:candidateId/:postId
 * Retrieve the latest generated report for a candidate and post.
 */
router.get('/:candidateId/:postId', (req, res) => {
  try {
    const { candidateId, postId } = req.params;
    const report = reports.getByCandidateAndPost(candidateId, postId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: `No report found for candidate '${candidateId}' and post '${postId}'. Call /api/report/generate first.`,
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/report/:candidateId/:postId/pdf
 * Download formatted PDF evaluation dossier.
 */
router.get('/:candidateId/:postId/pdf', (req, res) => {
  try {
    const { candidateId, postId } = req.params;
    const report = reports.getByCandidateAndPost(candidateId, postId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: `No report found for candidate '${candidateId}' and post '${postId}'. Call /api/report/generate first.`,
      });
    }

    const { generateEvaluationPdf } = require('../services/pdfService');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=RACSim-Dossier-${candidateId}.pdf`);

    generateEvaluationPdf(report, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
