/**
 * Scoring Service for Interview Simulation
 * Computes individual component averages and exact weighted final score:
 *   Question relevance: 10%
 *   Answer relevance:   25%
 *   Technical knowledge: 35%
 *   Depth/completeness: 15%
 *   Communication:      10%
 *   Consistency:         5%
 */

const WEIGHTS = {
  questionRelevance: 0.10,
  answerRelevance: 0.25,
  technicalKnowledge: 0.35,
  depthCompleteness: 0.15,
  communication: 0.10,
  consistency: 0.05,
};

function round2(val) {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

function calculateAverage(arr) {
  if (!arr || arr.length === 0) return 0;
  const valid = arr.filter((x) => typeof x === 'number' && !isNaN(x));
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  return round2(sum / valid.length);
}

/**
 * Computes the final report from answers, questions, candidate, and question relevance cache.
 */
function generateInterviewReport({ candidateId, postId, candidate, answersList, questionsMap, questionRelevanceCache }) {
  if (!answersList || answersList.length === 0) {
    return {
      candidateId,
      postId,
      candidateName: candidate?.name || 'Unknown',
      questionRelevanceAvg: 0,
      answerRelevanceAvg: 0,
      technicalKnowledgeScore: 0,
      depthScore: 0,
      communicationScore: 0,
      consistencyScore: 0,
      finalWeightedScore: 0,
      weightsUsed: WEIGHTS,
      totalQuestionsAnswered: 0,
      questionByQuestionEvidence: [],
    };
  }

  const questionRelevanceScores = [];
  const answerRelevanceScores = [];
  const technicalKnowledgeScores = [];
  const depthScores = [];
  const communicationScores = [];
  const consistencyScores = [];

  const questionByQuestionEvidence = answersList.map((ans) => {
    const q = questionsMap[ans.questionId] || {
      id: ans.questionId,
      text: 'Unknown Question',
      domain: 'Unknown',
      stage: 'Unknown',
      difficulty: 1,
      expectedConcepts: [],
    };

    // Retrieve cached question relevance score or fallback to 70.0
    let qRel = 70.0;
    const cachedRel = questionRelevanceCache ? questionRelevanceCache.get(candidateId, ans.questionId) : null;
    if (cachedRel && typeof cachedRel.relevanceScore === 'number') {
      qRel = cachedRel.relevanceScore;
    }
    questionRelevanceScores.push(qRel);

    // AI scores on answer
    const ansRel = typeof ans.aiRelevanceScore === 'number' ? ans.aiRelevanceScore : 0.0;
    answerRelevanceScores.push(ansRel);

    // Manual expert ratings
    const manual = ans.manualScores || {};
    const tech = typeof manual.technicalKnowledge === 'number' ? manual.technicalKnowledge : null;
    const depth = typeof manual.depthCompleteness === 'number' ? manual.depthCompleteness : null;
    const comm = typeof manual.communication === 'number' ? manual.communication : null;
    const cons = typeof manual.consistency === 'number' ? manual.consistency : null;

    if (tech !== null) technicalKnowledgeScores.push(tech);
    if (depth !== null) depthScores.push(depth);
    if (comm !== null) communicationScores.push(comm);
    if (cons !== null) consistencyScores.push(cons);

    return {
      questionId: q.id,
      questionText: q.text,
      stage: q.stage,
      difficulty: q.difficulty,
      expectedConcepts: q.expectedConcepts,
      questionRelevanceScore: round2(qRel),
      answerId: ans.id,
      answerText: ans.text,
      aiRelevanceScore: round2(ansRel),
      aiConceptCoverageScore: round2(ans.aiConceptCoverageScore || 0),
      manualScores: {
        technicalKnowledge: tech !== null ? tech : 0,
        depthCompleteness: depth !== null ? depth : 0,
        communication: comm !== null ? comm : 0,
        consistency: cons !== null ? cons : 0,
      },
      notes: ans.notes || '',
    };
  });

  const questionRelevanceAvg = calculateAverage(questionRelevanceScores);
  const answerRelevanceAvg = calculateAverage(answerRelevanceScores);
  const technicalKnowledgeScore = calculateAverage(technicalKnowledgeScores);
  const depthScore = calculateAverage(depthScores);
  const communicationScore = calculateAverage(communicationScores);
  const consistencyScore = calculateAverage(consistencyScores);

  const finalWeightedScore = round2(
    questionRelevanceAvg * WEIGHTS.questionRelevance +
    answerRelevanceAvg * WEIGHTS.answerRelevance +
    technicalKnowledgeScore * WEIGHTS.technicalKnowledge +
    depthScore * WEIGHTS.depthCompleteness +
    communicationScore * WEIGHTS.communication +
    consistencyScore * WEIGHTS.consistency
  );

  return {
    candidateId,
    postId,
    candidateName: candidate?.name || 'Unknown',
    questionRelevanceAvg,
    answerRelevanceAvg,
    technicalKnowledgeScore,
    depthScore,
    communicationScore,
    consistencyScore,
    finalWeightedScore,
    weightsUsed: WEIGHTS,
    totalQuestionsAnswered: answersList.length,
    questionByQuestionEvidence,
  };
}

module.exports = {
  WEIGHTS,
  generateInterviewReport,
  calculateAverage,
  round2,
};
