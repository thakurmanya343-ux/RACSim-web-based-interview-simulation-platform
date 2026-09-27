const { questions } = require('../db');

const STAGES = [
  'IceBreaking',
  'ProjectDiscussion',
  'BasicTechnical',
  'AdvancedTechnical',
  'Managerial',
];

/**
 * Evaluates previous answer performance and determines the next question,
 * stage, and difficulty according to the RACSim adaptive questioning engine.
 */
function selectNextAdaptiveQuestion({ session, candidate, lastAnswer = null }) {
  const askedIds = new Set(session.askedQuestionIds || []);
  const allQuestions = questions.getAll();
  const availableQuestions = allQuestions.filter((q) => !askedIds.has(q.id));

  if (availableQuestions.length === 0) {
    return {
      nextQuestion: null,
      isFinished: true,
      reason: 'Question bank exhausted for this session.',
    };
  }

  const askedCount = askedIds.size;
  let targetStage = session.currentStage || 'IceBreaking';
  let targetDifficulty = 2; // Default starting difficulty (Intermediate)
  let nextAction = 'initial';
  let previousScore = null;

  // If there was a previous answer evaluated in this session
  if (lastAnswer) {
    const aiRel = typeof lastAnswer.aiRelevanceScore === 'number' ? lastAnswer.aiRelevanceScore : 70;
    const conceptCov = typeof lastAnswer.aiConceptCoverageScore === 'number' ? lastAnswer.aiConceptCoverageScore : 70;
    
    // Manual tech score if provided, else combined AI score
    const manualTech = lastAnswer.manualScores?.technicalKnowledge;
    previousScore = typeof manualTech === 'number'
      ? Math.round((manualTech * 0.5 + aiRel * 0.25 + conceptCov * 0.25) * 10) / 10
      : Math.round((aiRel * 0.4 + conceptCov * 0.6) * 10) / 10;

    const lastQ = allQuestions.find((q) => q.id === lastAnswer.questionId);
    const lastDifficulty = lastQ ? lastQ.difficulty : 2;

    if (previousScore >= 75) {
      // High performance: increase difficulty or advance to advanced technical
      targetDifficulty = Math.min(4, lastDifficulty + 1);
      nextAction = 'increase_difficulty';
    } else if (previousScore >= 50) {
      // Medium performance: stay at current difficulty
      targetDifficulty = lastDifficulty;
      nextAction = 'maintain_difficulty';
    } else {
      // Low performance: reduce difficulty to foundational level
      targetDifficulty = Math.max(1, lastDifficulty - 1);
      nextAction = 'decrease_difficulty';
    }
  }

  // Determine stage progression by target question sequence
  if (askedCount === 0) {
    targetStage = 'IceBreaking';
    targetDifficulty = 1;
  } else if (askedCount === 1) {
    targetStage = 'ProjectDiscussion';
  } else if (askedCount === 2) {
    targetStage = 'BasicTechnical';
  } else if (askedCount === 3) {
    targetStage = previousScore && previousScore >= 70 ? 'AdvancedTechnical' : 'BasicTechnical';
  } else if (askedCount >= 4) {
    targetStage = 'Managerial';
  }

  // Search candidate pool:
  // 1. Exact stage + exact difficulty
  let pool = availableQuestions.filter((q) => q.stage.toLowerCase() === targetStage.toLowerCase() && q.difficulty === targetDifficulty);

  // 2. Exact stage + any difficulty
  if (pool.length === 0) {
    pool = availableQuestions.filter((q) => q.stage.toLowerCase() === targetStage.toLowerCase());
  }

  // 3. Any available question
  if (pool.length === 0) {
    pool = availableQuestions;
  }

  // Rank by candidate skill keyword overlap
  const candidateSkills = (candidate?.skills || []).map((s) => s.toLowerCase());
  const scoredPool = pool.map((q) => {
    let matchCount = 0;
    const qText = (q.text + ' ' + (q.expectedConcepts || []).join(' ')).toLowerCase();
    for (const skill of candidateSkills) {
      if (qText.includes(skill)) matchCount++;
    }
    return { question: q, matchCount };
  });

  scoredPool.sort((a, b) => b.matchCount - a.matchCount);
  const selectedQuestion = scoredPool[0].question;

  return {
    nextQuestion: selectedQuestion,
    isFinished: false,
    adaptiveReasoning: {
      previousScore,
      nextAction,
      targetStage: selectedQuestion.stage,
      targetDifficulty: selectedQuestion.difficulty,
      explanation: getAdaptiveExplanation(nextAction, previousScore, selectedQuestion),
    },
  };
}

function getAdaptiveExplanation(action, score, question) {
  if (action === 'increase_difficulty') {
    return `Candidate demonstrated strong competence (score: ${score}%). System increased difficulty to Level ${question.difficulty} in ${question.stage}.`;
  }
  if (action === 'decrease_difficulty') {
    return `Candidate experienced difficulty on the previous concept (score: ${score}%). System adjusted difficulty down to foundational Level ${question.difficulty}.`;
  }
  if (action === 'maintain_difficulty') {
    return `Candidate maintained steady performance (score: ${score}%). System explored a lateral concept at Level ${question.difficulty}.`;
  }
  return `Starting interview session in stage ${question.stage} at Level ${question.difficulty}.`;
}

module.exports = {
  STAGES,
  selectNextAdaptiveQuestion,
};
