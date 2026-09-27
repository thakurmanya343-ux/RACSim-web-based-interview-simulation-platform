const express = require('express');
const router = express.Router();
const multer = require('multer');
const { interviewSessions, candidates, posts, questions, answers, reports, transcripts, db } = require('../db');
const { selectNextAdaptiveQuestion } = require('../services/adaptiveService');
const { computeSimilarity, evaluateConcepts } = require('../services/aiService');
const { generateInterviewReport } = require('../services/scoringService');
const { generateEvaluationPdf } = require('../services/pdfService');
const { transcribeSpeech } = require('../services/sttService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

/**
 * POST /api/interviews
 * Body: { candidateId, postId, level, type, duration, adaptiveMode, targetQuestionCount }
 * Creates a new Board Room interview session and initializes the first question.
 */
router.post('/', async (req, res) => {
  try {
    const {
      candidateId = 'cand-001',
      postId = 'post-scientist-b-ai',
      level = 'Intermediate',
      type = 'Techno-Managerial',
      duration = 45,
      adaptiveMode = true,
      targetQuestionCount = 5,
    } = req.body;

    const candidate = candidates.getById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, error: `Candidate '${candidateId}' not found.` });
    }

    const post = posts.getById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: `Post '${postId}' not found.` });
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const session = interviewSessions.create({
      id: sessionId,
      candidateId,
      postId,
      level,
      type,
      duration,
      adaptiveMode,
      targetQuestionCount,
    });

    // Pick first adaptive question (IceBreaking stage)
    const adaptiveResult = selectNextAdaptiveQuestion({ session, candidate });
    if (adaptiveResult.nextQuestion) {
      interviewSessions.addAskedQuestion(session.id, adaptiveResult.nextQuestion.id);
    }

    const updatedSession = interviewSessions.getById(session.id);

    res.status(201).json({
      success: true,
      message: 'Interview session created successfully.',
      data: {
        session: updatedSession,
        candidate,
        post,
        currentQuestion: adaptiveResult.nextQuestion,
        adaptiveReasoning: adaptiveResult.adaptiveReasoning,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/interviews
 * List all interview sessions.
 */
router.get('/', (req, res) => {
  try {
    const list = interviewSessions.getAll();
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
 * GET /api/interviews/:id
 * Retrieve live session state for the Board Room.
 */
router.get('/:id', (req, res) => {
  try {
    const session = interviewSessions.getById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: `Interview session '${req.params.id}' not found.` });
    }

    const candidate = candidates.getById(session.candidateId);
    const post = posts.getById(session.postId);
    const candidateAnswers = answers.getByCandidate(session.candidateId);

    // Retrieve asked question objects
    const allQuestions = questions.getAll();
    const askedQuestionDetails = (session.askedQuestionIds || []).map((qId) =>
      allQuestions.find((q) => q.id === qId) || { id: qId, text: 'Unknown' }
    );

    const currentQuestion = askedQuestionDetails.length > 0 ? askedQuestionDetails[askedQuestionDetails.length - 1] : null;

    res.json({
      success: true,
      data: {
        session,
        candidate,
        post,
        currentQuestion,
        askedQuestions: askedQuestionDetails,
        answers: candidateAnswers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/interviews/:id/select-question
 * Body: { questionId }
 * Allows interviewer to deliver an AI recommended question directly to candidate
 */
router.post('/:id/select-question', (req, res) => {
  try {
    const { questionId } = req.body;
    const session = interviewSessions.getById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: `Interview session '${req.params.id}' not found.` });
    }

    const question = questions.getById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, error: `Question '${questionId}' not found.` });
    }

    interviewSessions.addAskedQuestion(session.id, question.id);
    interviewSessions.update(session.id, { currentStage: question.stage });

    res.json({
      success: true,
      message: 'Question selected and delivered to candidate.',
      data: {
        currentQuestion: question,
        session: interviewSessions.getById(session.id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/interviews/:id/custom-question
 * Body: { text, expectedConcepts, stage, difficulty }
 * Allows interviewer to ask their own custom question directly to candidate
 */
router.post('/:id/custom-question', (req, res) => {
  try {
    const { text, expectedConcepts = [], stage = 'TechnicalCore', difficulty = 2 } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Question text is required.' });
    }

    const session = interviewSessions.getById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: `Interview session '${req.params.id}' not found.` });
    }

    const customId = `q-custom-${Date.now()}`;
    const cleanConcepts = Array.isArray(expectedConcepts)
      ? expectedConcepts
      : (typeof expectedConcepts === 'string' ? expectedConcepts.split(',').map((c) => c.trim()).filter(Boolean) : []);

    const newQuestion = {
      id: customId,
      text: text.trim(),
      domain: 'Custom Technical & Domain Question',
      stage: stage || 'TechnicalCore',
      difficulty: Number(difficulty) || 2,
      expectedConcepts: cleanConcepts,
    };

    db.prepare(`
      INSERT INTO questions (id, text, domain, stage, difficulty, expectedConcepts)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      newQuestion.id,
      newQuestion.text,
      newQuestion.domain,
      newQuestion.stage,
      newQuestion.difficulty,
      JSON.stringify(newQuestion.expectedConcepts)
    );

    interviewSessions.addAskedQuestion(session.id, newQuestion.id);
    interviewSessions.update(session.id, { currentStage: newQuestion.stage });

    res.json({
      success: true,
      message: 'Custom question asked by interviewer and delivered to candidate.',
      data: {
        currentQuestion: newQuestion,
        session: interviewSessions.getById(session.id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/interviews/:id/next-question
 * Adaptively determines the next question based on performance on previous answer.
 */
router.post('/:id/next-question', (req, res) => {
  try {
    const session = interviewSessions.getById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: `Interview session '${req.params.id}' not found.` });
    }

    const candidate = candidates.getById(session.candidateId);
    const candidateAnswers = answers.getByCandidate(session.candidateId);
    const lastAnswer = candidateAnswers.length > 0 ? candidateAnswers[candidateAnswers.length - 1] : null;

    const adaptiveResult = selectNextAdaptiveQuestion({ session, candidate, lastAnswer });

    if (adaptiveResult.isFinished || !adaptiveResult.nextQuestion) {
      return res.json({
        success: true,
        isFinished: true,
        message: 'All target questions completed or question bank exhausted.',
        session,
      });
    }

    interviewSessions.addAskedQuestion(session.id, adaptiveResult.nextQuestion.id);
    interviewSessions.update(session.id, { currentStage: adaptiveResult.nextQuestion.stage });

    res.json({
      success: true,
      data: {
        nextQuestion: adaptiveResult.nextQuestion,
        adaptiveReasoning: adaptiveResult.adaptiveReasoning,
        session: interviewSessions.getById(session.id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/interviews/:id/answers
 * Body: { questionId, answerText }
 * Submits candidate answer in session and runs AI scoring.
 */
router.post('/:id/answers', async (req, res) => {
  try {
    const { questionId, answerText } = req.body;
    const session = interviewSessions.getById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: `Interview session '${req.params.id}' not found.` });
    }

    const question = questions.getById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, error: `Question '${questionId}' not found.` });
    }

    // 1. AI Relevance
    const relResult = await computeSimilarity(answerText, question.text);
    const relevanceScore = Math.round(relResult.similarity * 10000) / 100;

    // 2. AI Concept Coverage
    const coverageResult = await evaluateConcepts(answerText, question.expectedConcepts || []);
    const conceptCoverageScore = coverageResult.coveragePercentage;

    const answerId = `ans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const savedAnswer = answers.save({
      id: answerId,
      questionId,
      candidateId: session.candidateId,
      text: answerText,
      aiRelevanceScore: relevanceScore,
      aiConceptCoverageScore: conceptCoverageScore,
      manualScores: {},
      notes: '',
    });

    res.json({
      success: true,
      message: 'Answer submitted and evaluated by AI.',
      data: {
        answerId: savedAnswer.id,
        relevanceScore,
        conceptCoverageScore,
        coveredConcepts: coverageResult.coveredConcepts || [],
        missedConcepts: coverageResult.missedConcepts || [],
        conceptDetails: coverageResult.details || [],
        isFallback: relResult.isFallback || coverageResult.isFallback || false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/interviews/:id/voice-answer
 * Uploads voice answer for the active question.
 * Supports:
 * - Multipart audio file ('audio')
 * - JSON body with base64 audio ('audio_base64')
 * - Client-recognized text ('hint' or 'transcript' e.g. from Web Speech API)
 *
 * Flow: Microphone -> STT -> Transcript -> Answer Storage -> Semantic Scoring -> Adaptive Next Question.
 */
router.post('/:id/voice-answer', upload.single('audio'), async (req, res) => {
  try {
    const session = interviewSessions.getById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: `Interview session '${req.params.id}' not found.` });
    }

    const questionId = req.body.questionId || (session.askedQuestionIds && session.askedQuestionIds[session.askedQuestionIds.length - 1]);
    if (!questionId) {
      return res.status(400).json({ success: false, error: 'No active question found to answer.' });
    }

    const question = questions.getById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, error: `Question '${questionId}' not found.` });
    }

    const audioBuffer = req.file ? req.file.buffer : null;
    const base64Audio = req.body.audio_base64 || req.body.base64Audio || null;
    const hint = req.body.hint || req.body.transcript || req.body.audio_text_hint || null;
    const language = req.body.language || 'en-US';

    if (!audioBuffer && !base64Audio && !hint) {
      return res.status(400).json({
        success: false,
        error: 'Please provide audio file (multipart "audio"), "audio_base64", or text "transcript" / "hint".',
      });
    }

    // 1. Transcribe Speech
    const sttResult = await transcribeSpeech({
      audioBuffer,
      base64Audio,
      hint,
      language,
    });

    const answerText = sttResult.transcript && sttResult.transcript.trim() ? sttResult.transcript.trim() : '(No speech detected)';

    // 2. Save to Interview Live Transcripts
    const transcriptEntry = transcripts.create({
      interviewId: session.id,
      questionId: question.id,
      speaker: 'candidate',
      text: answerText,
      confidence: sttResult.confidence,
      engine: sttResult.engine,
      durationSeconds: sttResult.durationSeconds,
      isFinal: true,
    });

    // 3. AI Scoring on Transcribed Answer
    const relResult = await computeSimilarity(answerText, question.text);
    const relevanceScore = Math.round(relResult.similarity * 10000) / 100;

    const coverageResult = await evaluateConcepts(answerText, question.expectedConcepts || []);
    const conceptCoverageScore = coverageResult.coveragePercentage;

    // 4. Save Answer in DB
    const answerId = `ans-v-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const savedAnswer = answers.save({
      id: answerId,
      questionId: question.id,
      candidateId: session.candidateId,
      text: answerText,
      aiRelevanceScore: relevanceScore,
      aiConceptCoverageScore: conceptCoverageScore,
      manualScores: {},
      notes: `Transcribed via ${sttResult.engine} (${sttResult.durationSeconds}s)`,
      inputMode: 'voice',
    });

    // 5. Check Adaptive Next Question
    const candidate = candidates.getById(session.candidateId);
    const adaptiveResult = selectNextAdaptiveQuestion({ session, candidate, lastAnswer: savedAnswer });

    let nextQuestion = null;
    if (!adaptiveResult.isFinished && adaptiveResult.nextQuestion) {
      interviewSessions.addAskedQuestion(session.id, adaptiveResult.nextQuestion.id);
      interviewSessions.update(session.id, { currentStage: adaptiveResult.nextQuestion.stage });
      nextQuestion = adaptiveResult.nextQuestion;
    }

    res.json({
      success: true,
      message: 'Voice answer transcribed, scored, and recorded.',
      data: {
        transcript: answerText,
        stt: {
          engine: sttResult.engine,
          confidence: sttResult.confidence,
          wordCount: sttResult.wordCount,
          durationSeconds: sttResult.durationSeconds,
          status: sttResult.status,
        },
        answer: savedAnswer,
        scoring: {
          relevanceScore,
          conceptCoverageScore,
          coveredConcepts: coverageResult.coveredConcepts || [],
          missedConcepts: coverageResult.missedConcepts || [],
          details: coverageResult.details || [],
        },
        transcriptEntry,
        isFinished: adaptiveResult.isFinished || false,
        nextQuestion,
        adaptiveReasoning: adaptiveResult.adaptiveReasoning,
        session: interviewSessions.getById(session.id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/interviews/:id/transcript
 * Returns chronological transcript log for the interview session.
 */
router.get('/:id/transcript', (req, res) => {
  try {
    const session = interviewSessions.getById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: `Interview session '${req.params.id}' not found.` });
    }

    const list = transcripts.getByInterview(session.id);
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
 * POST /api/interviews/:id/transcript
 * Ingests a transcript chunk into the live session feed.
 */
router.post('/:id/transcript', (req, res) => {
  try {
    const session = interviewSessions.getById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: `Interview session '${req.params.id}' not found.` });
    }

    const { questionId, speaker = 'candidate', text, audioUrl, confidence = 1.0, isFinal = true } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text content is required for transcript.' });
    }

    const entry = transcripts.create({
      interviewId: session.id,
      questionId: questionId || null,
      speaker,
      text: text.trim(),
      audioUrl: audioUrl || null,
      confidence,
      engine: 'client-stream',
      isFinal: Boolean(isFinal),
    });

    res.status(201).json({
      success: true,
      message: 'Transcript segment saved.',
      data: entry,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/interviews/:id/finish
 * Concludes the interview session and generates the final weighted report.
 */
router.post('/:id/finish', async (req, res) => {
  try {
    const session = interviewSessions.getById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: `Interview session '${req.params.id}' not found.` });
    }

    interviewSessions.complete(session.id);

    const candidate = candidates.getById(session.candidateId);
    const answersList = answers.getByCandidate(session.candidateId);
    const allQuestions = questions.getAll();
    const questionsMap = {};
    for (const q of allQuestions) questionsMap[q.id] = q;

    const reportData = generateInterviewReport({
      candidateId: session.candidateId,
      postId: session.postId,
      candidate,
      answersList,
      questionsMap,
    });

    const reportId = `report-${session.candidateId}-${session.postId}`;
    const savedReport = reports.save({
      id: reportId,
      ...reportData,
    });

    res.json({
      success: true,
      message: 'Interview concluded. Final report generated.',
      data: {
        session: interviewSessions.getById(session.id),
        report: savedReport,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/interviews/:id/report/pdf
 * Downloads printable PDF dossier for this interview session.
 */
router.get('/:id/report/pdf', (req, res) => {
  try {
    const session = interviewSessions.getById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: `Session '${req.params.id}' not found.` });
    }

    const report = reports.getByCandidateAndPost(session.candidateId, session.postId);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not generated yet. Call /finish first.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=RACSim-Evaluation-${session.candidateId}.pdf`);

    generateEvaluationPdf(report, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
