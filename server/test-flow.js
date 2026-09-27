/**
 * End-to-End Integration Test for Interview Simulation Backend
 * Walks through full flow:
 *   1. Get Posts & Candidate Profile
 *   2. Filter Question Bank
 *   3. Score Question Relevance for Candidate
 *   4. Submit Candidate Answer & Evaluate with AI (Cosine Relevance + Concept Coverage)
 *   5. Submit Expert Manual Scoring
 *   6. Submit a Second Answer (Advanced Technical) with Scores
 *   7. Generate Full Evaluation Report with Exact Weights
 *   8. Fetch Persisted Report
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

function separator(title) {
  console.log('\n' + '='.repeat(70));
  console.log(`>>> ${title}`);
  console.log('='.repeat(70));
}

async function runIntegrationFlow() {
  try {
    separator('STEP 1: Verify System Health & Seeded Data');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    console.log('Server Health:', healthRes.data);

    const postsRes = await axios.get(`${BASE_URL}/posts`);
    console.log(`Found ${postsRes.data.count} post(s):`, postsRes.data.data.map(p => ({ id: p.id, title: p.title, domain: p.domain })));
    const postId = postsRes.data.data[0].id;

    const candId = 'cand-001';
    const candRes = await axios.get(`${BASE_URL}/candidates/${candId}`);
    console.log('Candidate Loaded:', {
      id: candRes.data.data.id,
      name: candRes.data.data.name,
      skills: candRes.data.data.skills,
      appliedPost: candRes.data.data.appliedPost,
    });

    separator('STEP 2: Filter Questions Bank by Stage');
    const questionsRes = await axios.get(`${BASE_URL}/questions?stage=BasicTechnical`);
    console.log(`Retrieved ${questionsRes.data.count} BasicTechnical questions.`);
    const sampleQuestion = questionsRes.data.data.find(q => q.id === 'q-08') || questionsRes.data.data[0];
    console.log('Selected Question for Simulation:', {
      id: sampleQuestion.id,
      text: sampleQuestion.text,
      stage: sampleQuestion.stage,
      expectedConcepts: sampleQuestion.expectedConcepts,
    });

    separator('STEP 3: Score Question Relevance to Candidate Profile');
    const qRelRes = await axios.post(`${BASE_URL}/score/question-relevance`, {
      candidateId: candId,
      questionId: sampleQuestion.id,
    });
    console.log('Question Relevance Evaluation:');
    console.log(`- Candidate Skills: ${qRelRes.data.candidateSkills.join(', ')}`);
    console.log(`- Question Text: "${qRelRes.data.questionText}"`);
    console.log(`- Relevance Score (0-100): ${qRelRes.data.relevanceScore}`);
    console.log(`- Used Fallback?: ${qRelRes.data.isFallback}`);

    separator('STEP 4: Evaluate Candidate Answer via AI Microservice');
    const candidateAnswerText1 = `We selected a Convolutional Neural Network (CNN) because it exploits parameter sharing and translation invariance. The convolutional filters perform localized feature extraction across image channels, capturing low-level edges up to high-level semantic shapes while preserving the spatial hierarchy of image pixels.`;
    
    console.log(`Candidate Answer: "${candidateAnswerText1}"`);
    const evalRes1 = await axios.post(`${BASE_URL}/score/answer-evaluation`, {
      candidateId: candId,
      questionId: sampleQuestion.id,
      answerText: candidateAnswerText1,
    });

    console.log('AI Answer Evaluation Result:');
    console.log(`- Answer ID: ${evalRes1.data.answerId}`);
    console.log(`- AI Relevance Score (0-100): ${evalRes1.data.relevanceScore}`);
    console.log(`- Concept Coverage Score (0-100): ${evalRes1.data.conceptCoverageScore}%`);
    console.log(`- Covered Concepts:`, evalRes1.data.coveredConcepts);
    console.log(`- Missed Concepts:`, evalRes1.data.missedConcepts);

    const answerId1 = evalRes1.data.answerId;

    separator('STEP 5: Submit Expert Manual Scoring for Answer 1');
    const manualScoreRes1 = await axios.post(`${BASE_URL}/manual-score`, {
      answerId: answerId1,
      technicalKnowledge: 92,
      depthCompleteness: 88,
      communication: 95,
      consistency: 90,
      notes: 'Strong clarity on spatial hierarchy and parameter sharing advantages of CNNs.',
    });
    console.log('Manual Scoring Confirmation:', {
      answerId: manualScoreRes1.data.data.id,
      manualScores: manualScoreRes1.data.data.manualScores,
      notes: manualScoreRes1.data.data.notes,
    });

    separator('STEP 6: Simulate Second Question (AdvancedTechnical - Imbalance)');
    const qAdv = (await axios.get(`${BASE_URL}/questions?stage=AdvancedTechnical`)).data.data.find(q => q.id === 'q-13');
    console.log('Second Question:', { id: qAdv.id, text: qAdv.text, expectedConcepts: qAdv.expectedConcepts });

    // Question relevance for q-13
    await axios.post(`${BASE_URL}/score/question-relevance`, { candidateId: candId, questionId: qAdv.id });

    // Answer evaluation
    const candidateAnswerText2 = `With heavy class imbalance, a standard cross-entropy loss causes the model to collapse toward the majority class. I would address this using Focal Loss or class-weighted loss, along with oversampling techniques like SMOTE, and monitor the precision-recall tradeoff rather than raw accuracy.`;
    const evalRes2 = await axios.post(`${BASE_URL}/score/answer-evaluation`, {
      candidateId: candId,
      questionId: qAdv.id,
      answerText: candidateAnswerText2,
    });
    console.log('Second Answer AI Evaluation:', {
      answerId: evalRes2.data.answerId,
      relevanceScore: evalRes2.data.relevanceScore,
      conceptCoverageScore: evalRes2.data.conceptCoverageScore,
      coveredConcepts: evalRes2.data.coveredConcepts,
    });

    // Manual score for answer 2
    await axios.post(`${BASE_URL}/manual-score`, {
      answerId: evalRes2.data.answerId,
      technicalKnowledge: 90,
      depthCompleteness: 85,
      communication: 90,
      consistency: 88,
      notes: 'Good understanding of Focal Loss and precision-recall metrics under imbalance.',
    });

    separator('STEP 7: Generate Final Report with Strict Weights');
    const reportRes = await axios.post(`${BASE_URL}/report/generate`, {
      candidateId: candId,
      postId: postId,
    });

    const report = reportRes.data.data;
    console.log('\nFINAL REPORT SUMMARY:');
    console.log(`- Candidate: ${report.candidateName} (${report.candidateId})`);
    console.log(`- Applied Post ID: ${report.postId}`);
    console.log(`- Total Questions Evaluated: ${report.totalQuestionsAnswered}`);
    console.log('\n--- Component Averages ---');
    console.log(`  Question Relevance Average (10% weight): ${report.questionRelevanceAvg}`);
    console.log(`  Answer Relevance Average   (25% weight): ${report.answerRelevanceAvg}`);
    console.log(`  Technical Knowledge Score  (35% weight): ${report.technicalKnowledgeScore}`);
    console.log(`  Depth & Completeness Score (15% weight): ${report.depthScore}`);
    console.log(`  Communication Score        (10% weight): ${report.communicationScore}`);
    console.log(`  Consistency Score           (5% weight): ${report.consistencyScore}`);
    console.log('\n=======================================================');
    console.log(`>>> FINAL WEIGHTED SCORE: ${report.finalWeightedScore}% <<<`);
    console.log('=======================================================');

    console.log('\nQuestion-by-Question Evidence:');
    report.questionByQuestionEvidence.forEach((item, idx) => {
      console.log(`\n[Question ${idx + 1}] (${item.stage}) ${item.questionText}`);
      console.log(`  - Question Relevance: ${item.questionRelevanceScore}`);
      console.log(`  - Answer: "${item.answerText.substring(0, 80)}..."`);
      console.log(`  - AI Relevance: ${item.aiRelevanceScore}, Concept Coverage: ${item.aiConceptCoverageScore}%`);
      console.log(`  - Manual Scores: Tech=${item.manualScores.technicalKnowledge}, Depth=${item.manualScores.depthCompleteness}, Comm=${item.manualScores.communication}, Cons=${item.manualScores.consistency}`);
      console.log(`  - Expert Notes: "${item.notes}"`);
    });

    separator('STEP 8: Verify GET /api/report/:candidateId/:postId');
    const getReportRes = await axios.get(`${BASE_URL}/report/${candId}/${postId}`);
    console.log('Report retrieval successful:', {
      candidateId: getReportRes.data.data.candidateId,
      finalWeightedScore: getReportRes.data.data.finalWeightedScore,
    });

    separator('SUCCESS: All 8 stages of integration flow passed seamlessly!');
  } catch (error) {
    console.error('Integration flow failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runIntegrationFlow();
