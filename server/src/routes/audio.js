const express = require('express');
const router = express.Router();
const multer = require('multer');
const { transcribeSpeech, createSyntheticTestWav } = require('../services/sttService');

// In-memory audio upload handler
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

/**
 * POST /api/audio/transcribe
 * Transcribes audio via multipart form upload OR JSON body with base64 audio.
 * Form field: 'audio' or 'file'
 * JSON body: { audio_base64: "...", hint: "...", language: "en-US" }
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const audioBuffer = req.file ? req.file.buffer : null;
    const base64Audio = req.body.audio_base64 || req.body.base64Audio || null;
    const hint = req.body.hint || req.body.audio_text_hint || null;
    const language = req.body.language || 'en-US';

    if (!audioBuffer && !base64Audio && !hint) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an audio file (field: "audio") or provide "audio_base64" or "hint" in request body.',
      });
    }

    const result = await transcribeSpeech({
      audioBuffer,
      base64Audio,
      hint,
      language,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/audio/test-sample
 * Generates a synthetic valid WAV file and returns its base64 string.
 */
router.post('/test-sample', (req, res) => {
  try {
    const wavBuffer = createSyntheticTestWav();
    res.json({
      success: true,
      message: 'Generated synthetic 16kHz WAV audio sample.',
      base64: wavBuffer.toString('base64'),
      mimeType: 'audio/wav',
      sizeBytes: wavBuffer.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
