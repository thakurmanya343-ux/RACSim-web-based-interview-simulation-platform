/**
 * Integration Test for RACSim Speech-to-Text (STT) and Live Audio Transcripts
 * PSWB01 - Selector-Applicant Simulation Platform
 */
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function runSpeechToTextTests() {
  console.log('================================================================');
  console.log('🎙️  TESTING SPEECH-TO-TEXT & LIVE BOARD ROOM TRANSCRIPTS');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${details}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Generate Synthetic WAV Sample
    // -------------------------------------------------------------
    console.log('[Step 1] Generate Synthetic WAV Audio Sample');
    const sampleRes = await axios.post(`${BASE_URL}/audio/test-sample`);
    assert(
      sampleRes.status === 200 && sampleRes.data.success && sampleRes.data.base64,
      'POST /api/audio/test-sample generates valid 16kHz WAV sample',
      JSON.stringify(sampleRes.data)
    );
    const wavBase64 = sampleRes.data.base64;

    // -------------------------------------------------------------
    // Test 2: Direct Transcription via Client Hint / Web Speech API
    // -------------------------------------------------------------
    console.log('\n[Step 2] Transcribe Client Speech Hint (Web Speech API Bridge)');
    const hintRes = await axios.post(`${BASE_URL}/audio/transcribe`, {
      hint: 'I built microservices using Node.js and trained deep learning models with PyTorch.',
      language: 'en-US',
    });
    assert(
      hintRes.status === 200 &&
      hintRes.data.success &&
      hintRes.data.data.transcript.includes('microservices'),
      'POST /api/audio/transcribe handles Web Speech API transcript hint',
      JSON.stringify(hintRes.data)
    );
    console.log(`     Engine: ${hintRes.data.data.engine}, Words: ${hintRes.data.data.wordCount}, Confidence: ${hintRes.data.data.confidence}`);

    // -------------------------------------------------------------
    // Test 3: Audio Base64 Transcription (Google Speech Engine)
    // -------------------------------------------------------------
    console.log('\n[Step 3] Transcribe Base64 WAV Audio Payload');
    const b64Res = await axios.post(`${BASE_URL}/audio/transcribe`, {
      audio_base64: wavBase64,
      language: 'en-US',
    });
    assert(
      b64Res.status === 200 && b64Res.data.success && b64Res.data.data.status,
      'POST /api/audio/transcribe processes Base64 WAV data without error',
      JSON.stringify(b64Res.data)
    );
    console.log(`     Engine: ${b64Res.data.data.engine}, Audio Duration: ${b64Res.data.data.durationSeconds}s, Status: ${b64Res.data.data.status}`);

    // -------------------------------------------------------------
    // Test 4: Create Board Room Interview Session
    // -------------------------------------------------------------
    console.log('\n[Step 4] Initialize Live Interview Session');
    const sessionRes = await axios.post(`${BASE_URL}/interviews`, {
      candidateId: 'cand-001',
      postId: 'post-scientist-b-ai',
      level: 'Intermediate',
      targetQuestionCount: 5,
    });
    assert(
      sessionRes.status === 201 && sessionRes.data.success && sessionRes.data.data.session.id,
      'POST /api/interviews creates session for candidate',
      JSON.stringify(sessionRes.data)
    );
    const session = sessionRes.data.data.session;
    const initialQuestion = sessionRes.data.data.currentQuestion;
    console.log(`     Session ID: ${session.id}, Current Question: "${initialQuestion.text}"`);

    // -------------------------------------------------------------
    // Test 5: Ingest Live Transcript Segment (Interviewer Prompt)
    // -------------------------------------------------------------
    console.log('\n[Step 5] Ingest Real-time Transcript Segment');
    const trRes = await axios.post(`${BASE_URL}/interviews/${session.id}/transcript`, {
      questionId: initialQuestion.id,
      speaker: 'interviewer',
      text: initialQuestion.text,
      confidence: 1.0,
      isFinal: true,
    });
    assert(
      trRes.status === 201 && trRes.data.success && trRes.data.data.id,
      'POST /api/interviews/:id/transcript appends speech segment',
      JSON.stringify(trRes.data)
    );

    // -------------------------------------------------------------
    // Test 6: Voice Answer Submission & AI Scoring Pipeline
    // -------------------------------------------------------------
    console.log('\n[Step 6] Submit Candidate Voice Answer (Microphone -> STT -> Scoring -> Adaptive)');
    const voiceAnswerRes = await axios.post(`${BASE_URL}/interviews/${session.id}/voice-answer`, {
      questionId: initialQuestion.id,
      audio_base64: wavBase64,
      hint: 'I completed my engineering degree in computer science and have specialized in machine learning and convolutional neural networks for computer vision.',
      language: 'en-US',
    });
    assert(
      voiceAnswerRes.status === 200 &&
      voiceAnswerRes.data.success &&
      voiceAnswerRes.data.data.transcript &&
      voiceAnswerRes.data.data.scoring,
      'POST /api/interviews/:id/voice-answer converts speech, logs transcript, and scores answer',
      JSON.stringify(voiceAnswerRes.data)
    );
    const vData = voiceAnswerRes.data.data;
    console.log(`     Transcribed Speech: "${vData.transcript}"`);
    console.log(`     AI Relevance Score: ${vData.scoring.relevanceScore}%`);
    console.log(`     AI Concept Coverage: ${vData.scoring.conceptCoverageScore}%`);
    console.log(`     Covered Concepts: [${vData.scoring.coveredConcepts.join(', ')}]`);
    console.log(`     Next Adaptive Question: ${vData.nextQuestion ? `"${vData.nextQuestion.text}"` : 'Finished'}`);

    // -------------------------------------------------------------
    // Test 7: Verify Live Chronological Transcript Log
    // -------------------------------------------------------------
    console.log('\n[Step 7] Fetch Chronological Board Room Transcript');
    const logRes = await axios.get(`${BASE_URL}/interviews/${session.id}/transcript`);
    assert(
      logRes.status === 200 && logRes.data.success && logRes.data.count >= 2,
      'GET /api/interviews/:id/transcript returns all session speech logs',
      `Count: ${logRes.data.count}`
    );
    for (const item of logRes.data.data) {
      console.log(`     [${item.speaker.toUpperCase()}]: ${item.text.substring(0, 70)}... (${item.engine})`);
    }

    // -------------------------------------------------------------
    // Test 8: Verify Answer Mode in Session State
    // -------------------------------------------------------------
    console.log('\n[Step 8] Verify Answer Record Recorded as Voice');
    const sessionState = await axios.get(`${BASE_URL}/interviews/${session.id}`);
    const lastAns = sessionState.data.data.answers.find((a) => a.id === vData.answer.id);
    assert(
      lastAns && lastAns.inputMode === 'voice',
      'Answer record correctly tagged with inputMode="voice"',
      JSON.stringify(lastAns)
    );
    console.log(`     Answer ID: ${lastAns.id}, Mode: ${lastAns.inputMode}, Notes: ${lastAns.notes}`);

  } catch (error) {
    console.error('Fatal test error:', error.response ? error.response.data : error.message);
  }

  console.log('\n================================================================');
  console.log(`📊 STT TEST SUMMARY: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runSpeechToTextTests();
