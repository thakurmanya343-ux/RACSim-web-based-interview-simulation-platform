const express = require('express');
const router = express.Router();
const multer = require('multer');
const { candidates, posts } = require('../db');
const { processCandidateResume } = require('../services/resumeService');

// In-memory file buffer upload
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * GET /api/candidates
 * List all candidates.
 */
router.get('/', (req, res) => {
  try {
    const allCandidates = candidates.getAll();
    res.json({
      success: true,
      count: allCandidates.length,
      data: allCandidates,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/candidates/:id
 * Retrieve candidate profile by ID, including applied post details.
 */
router.get('/:id', (req, res) => {
  try {
    const candidate = candidates.getById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, error: `Candidate '${req.params.id}' not found.` });
    }

    const appliedPost = candidate.appliedPost ? posts.getById(candidate.appliedPost) : null;

    res.json({
      success: true,
      data: {
        ...candidate,
        postDetails: appliedPost,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/candidates/:id
 * Update candidate profile fields.
 */
router.put('/:id', (req, res) => {
  try {
    const { name, skills, appliedPost, domainTags } = req.body;
    const updated = candidates.updateProfile(req.params.id, {
      name,
      skills,
      appliedPost,
      domainTags,
    });
    if (!updated) {
      return res.status(404).json({ success: false, error: `Candidate '${req.params.id}' not found.` });
    }
    res.json({
      success: true,
      message: 'Candidate profile updated successfully.',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/candidates/:id/resume
 * Uploads CV/Resume (either multipart file or JSON { resumeText }).
 * Extracts skills, education, experience, and updates candidate profile.
 */
router.post('/:id/resume', upload.single('resume'), async (req, res) => {
  try {
    const candidateId = req.params.id;
    let resumeText = '';
    let fileName = 'resume.txt';

    if (req.file) {
      // If file uploaded via form-data
      resumeText = req.file.buffer.toString('utf8');
      fileName = req.file.originalname || 'uploaded_resume.txt';
    } else if (req.body && req.body.resumeText) {
      // If raw text provided via JSON
      resumeText = req.body.resumeText;
      fileName = req.body.fileName || 'submitted_resume.txt';
    } else {
      return res.status(400).json({
        success: false,
        error: "Please provide a resume file in multipart form-data or 'resumeText' in JSON body.",
      });
    }

    const parseResult = await processCandidateResume(candidateId, resumeText, fileName);

    res.json({
      success: true,
      message: 'Resume parsed and candidate profile updated successfully.',
      data: {
        candidateId,
        parsedProfile: parseResult.parsedProfile,
        updatedCandidate: parseResult.candidate,
        isFallback: parseResult.isFallback,
      },
    });
  } catch (error) {
    console.error('Error in /api/candidates/:id/resume:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
