const express = require('express');
const router = express.Router();
const { codingRooms } = require('../db');
const { executeCode, getChallengesByProfession, CODING_CHALLENGES } = require('../services/executionService');

/**
 * GET /api/coding/challenges?profession=
 * Returns challenges filtered by profession.
 */
router.get('/challenges', (req, res) => {
  try {
    const { profession } = req.query;
    const list = getChallengesByProfession(profession);
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
 * POST /api/coding/room
 * Body: { profession, candidateId, language }
 * Initializes a live coding room when candidate selects their profession.
 */
router.post('/room', (req, res) => {
  try {
    const { profession = 'Artificial Intelligence', candidateId = 'cand-001', language = 'python' } = req.body;
    const challenges = getChallengesByProfession(profession);
    const selectedChallenge = challenges.length > 0 ? challenges[0] : CODING_CHALLENGES[0];

    const roomId = `room-${profession.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
    const created = codingRooms.create({
      id: roomId,
      profession,
      language: selectedChallenge.language || language,
      challengeId: selectedChallenge.id,
      challengeTitle: selectedChallenge.title,
      challengeDescription: selectedChallenge.description,
      code: selectedChallenge.starterCode,
      candidateId,
    });

    res.status(201).json({
      success: true,
      message: 'Live coding room created successfully.',
      data: created,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/coding/room/:id
 * Retrieve live code, problem statement, and output for the interviewer or candidate.
 */
router.get('/room/:id', (req, res) => {
  try {
    const room = codingRooms.getById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, error: `Coding room '${req.params.id}' not found.` });
    }
    res.json({
      success: true,
      data: room,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/coding/room/:id/code
 * Body: { code }
 * Syncs candidate's live code edits into the room.
 */
router.post('/room/:id/code', (req, res) => {
  try {
    const { code } = req.body;
    if (typeof code !== 'string') {
      return res.status(400).json({ success: false, error: "Field 'code' must be a string." });
    }
    const updated = codingRooms.updateCode(req.params.id, code);
    if (!updated) {
      return res.status(404).json({ success: false, error: `Coding room '${req.params.id}' not found.` });
    }
    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/coding/room/:id/lock
 * Body: { locked: true | false }
 * Toggles editor lock (interviewer control).
 */
router.post('/room/:id/lock', (req, res) => {
  try {
    const { locked } = req.body;
    const updated = codingRooms.setLock(req.params.id, Boolean(locked));
    if (!updated) {
      return res.status(404).json({ success: false, error: `Coding room '${req.params.id}' not found.` });
    }
    res.json({
      success: true,
      message: `Editor ${locked ? 'locked' : 'unlocked'}.`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/coding/run-code
 * Body: { roomId?, language, code }
 * Executes Python or Node.js code live in the sandbox.
 */
router.post('/run-code', async (req, res) => {
  try {
    const { roomId, language = 'python', code = '' } = req.body;
    const result = await executeCode({ language, code });

    if (roomId) {
      codingRooms.updateOutput(roomId, result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      stdout: '',
      stderr: error.message,
      status: 'error',
      time: '0.00s',
      memory: '0 KB',
    });
  }
});

module.exports = router;
