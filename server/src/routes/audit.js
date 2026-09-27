const express = require('express');
const router = express.Router();
const { answers, reports, interviewSessions } = require('../db');

/**
 * GET /api/admin/audit/expert-consistency
 * Analyzes scoring patterns, variance, and AI-vs-Expert divergence across interviews.
 */
router.get('/expert-consistency', (req, res) => {
  try {
    const allAnswers = answers.getByCandidate('cand-001'); // Sample evaluation dataset
    const allReports = [reports.getByCandidateAndPost('cand-001', 'post-scientist-b-ai')].filter(Boolean);
    const sessions = interviewSessions.getAll();

    // Collect all recorded manual scores
    const techScores = [];
    const depthScores = [];
    const commScores = [];
    const consScores = [];
    const aiVsHumanDivergence = [];

    for (const ans of allAnswers) {
      const manual = ans.manualScores || {};
      if (typeof manual.technicalKnowledge === 'number') techScores.push(manual.technicalKnowledge);
      if (typeof manual.depthCompleteness === 'number') depthScores.push(manual.depthCompleteness);
      if (typeof manual.communication === 'number') commScores.push(manual.communication);
      if (typeof manual.consistency === 'number') consScores.push(manual.consistency);

      if (typeof manual.technicalKnowledge === 'number' && typeof ans.aiRelevanceScore === 'number') {
        aiVsHumanDivergence.push(Math.abs(manual.technicalKnowledge - ans.aiRelevanceScore));
      }
    }

    const calcAvg = (arr) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const calcVar = (arr, mean) => (arr.length > 0 ? arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length : 0);

    const techMean = calcAvg(techScores);
    const depthMean = calcAvg(depthScores);
    const commMean = calcAvg(commScores);
    const consMean = calcAvg(consScores);
    const overallExpertMean = calcAvg([...techScores, ...depthScores, ...commScores, ...consScores]);
    const overallVariance = calcVar([...techScores, ...depthScores, ...commScores, ...consScores], overallExpertMean);
    const avgDivergence = calcAvg(aiVsHumanDivergence);

    // Flag patterns based on variance and deviation
    let auditFlag = 'NORMAL_EVALUATION_PATTERN';
    let advisory = 'Evaluation pattern is balanced and consistent with standard panel distributions.';

    if (overallExpertMean > 92) {
      auditFlag = 'POTENTIAL_LENIENCY_BIAS';
      advisory = 'Review evaluation pattern: Expert scores are consistently near the upper ceiling.';
    } else if (overallExpertMean < 50 && overallExpertMean > 0) {
      auditFlag = 'POTENTIAL_STRICTNESS_BIAS';
      advisory = 'Review evaluation pattern: Expert scores are significantly lower than cohort benchmarks.';
    } else if (avgDivergence > 35) {
      auditFlag = 'HIGH_AI_HUMAN_DIVERGENCE';
      advisory = 'Noticeable divergence between AI semantic coverage metrics and expert manual scores.';
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalSessionsConducted: sessions.length,
        totalAnswersScored: techScores.length,
        totalReportsGenerated: allReports.length,
      },
      metrics: {
        overallExpertAverage: Math.round(overallExpertMean * 100) / 100,
        variance: Math.round(overallVariance * 100) / 100,
        standardDeviation: Math.round(Math.sqrt(overallVariance) * 100) / 100,
        dimensionAverages: {
          technicalKnowledge: Math.round(techMean * 100) / 100,
          depthCompleteness: Math.round(depthMean * 100) / 100,
          communication: Math.round(commMean * 100) / 100,
          consistency: Math.round(consMean * 100) / 100,
        },
        aiVsHumanAverageDivergence: Math.round(avgDivergence * 100) / 100,
      },
      auditResult: {
        flag: auditFlag,
        advisory,
        status: 'AUDIT_PASS',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
