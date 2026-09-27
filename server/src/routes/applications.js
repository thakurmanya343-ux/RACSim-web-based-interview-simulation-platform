const express = require('express');
const router = express.Router();
const { applications, candidates, posts, interviewSessions, db } = require('../db');
const { selectNextAdaptiveQuestion } = require('../services/adaptiveService');

/**
 * POST /api/applications
 * Body: { candidateId, vacancyId, matchScore, cvFileRef }
 * Creates a new application record with status 'Pending Schedule'
 */
router.post('/', (req, res) => {
  try {
    const { candidateId, vacancyId, matchScore, cvFileRef } = req.body;

    if (!candidateId || !vacancyId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: 'candidateId' and 'vacancyId' are required."
      });
    }

    const candidate = candidates.getById(candidateId);
    const post = posts.getById(vacancyId);

    const newApp = applications.create({
      candidateId,
      vacancyId,
      matchScore: Number(matchScore) || 75,
      status: 'Pending Schedule',
      cvFileRef: cvFileRef || candidate?.resumeUrl || '',
      appliedAt: new Date().toISOString(),
      scheduledAt: null
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. Awaiting selector scheduling.',
      application: newApp
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/applications
 * List all applications with enriched candidate and vacancy details
 */
router.get('/', (req, res) => {
  try {
    const allApps = applications.getAll();
    const enriched = allApps.map(app => {
      const candidate = candidates.getById(app.candidateId);
      const post = posts.getById(app.vacancyId);

      let candidateEmail = 'candidate@racsim.ai';
      if (candidate?.parsedProfile) {
        if (typeof candidate.parsedProfile === 'object') {
          candidateEmail = candidate.parsedProfile.email || candidateEmail;
        } else if (typeof candidate.parsedProfile === 'string') {
          try {
            candidateEmail = JSON.parse(candidate.parsedProfile).email || candidateEmail;
          } catch (e) {}
        }
      }

      return {
        ...app,
        candidateName: candidate ? candidate.name : 'Unknown Candidate',
        candidateEmail,
        candidateSkills: candidate ? (Array.isArray(candidate.skills) ? candidate.skills : (typeof candidate.skills === 'string' ? JSON.parse(candidate.skills || '[]') : [])) : [],
        originalFileName: app.cvFileRef ? app.cvFileRef.split('/').pop() : 'Resume.pdf',
        cvFileRef: app.cvFileRef || candidate?.resumeUrl || '',
        vacancyTitle: post ? post.title : 'Unspecified Vacancy',
        vacancyDomain: post ? post.domain : 'General',
        vacancyLevel: post ? post.level : 'Mid-Level',
        requiredSkills: post ? (Array.isArray(post.requiredSkills) ? post.requiredSkills : (typeof post.requiredSkills === 'string' ? JSON.parse(post.requiredSkills || '[]') : [])) : []
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/applications/:id/schedule
 * Body: { scheduledAt }
 * Updates application status to 'Interview Scheduled' and sets datetime
 */
router.patch('/:id/schedule', (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: 'scheduledAt' is required."
      });
    }

    const existing = applications.getById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Application '${id}' not found.`
      });
    }

    const updated = applications.updateSchedule(id, scheduledAt);

    res.json({
      success: true,
      message: 'Interview scheduled successfully in Board Room simulation.',
      application: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/applications/:id/accept
 * Candidate accepts the scheduled interview invitation and enters Board Room
 */
router.patch('/:id/accept', (req, res) => {
  try {
    const { id } = req.params;
    const existing = applications.getById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Application '${id}' not found.`
      });
    }

    const updated = applications.updateStatus(id, 'Accepted');

    // Find or create an interview session for candidate and vacancy
    const allSessions = interviewSessions.getAll();
    let session = allSessions.find(s => s.candidateId === existing.candidateId && s.postId === existing.vacancyId);

    if (!session) {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      session = interviewSessions.create({
        id: sessionId,
        candidateId: existing.candidateId,
        postId: existing.vacancyId,
        level: 'Intermediate',
        type: 'Techno-Managerial',
        duration: 45,
        adaptiveMode: true,
        targetQuestionCount: 5,
      });

      const candidate = candidates.getById(existing.candidateId);
      const adaptiveResult = selectNextAdaptiveQuestion({ session, candidate });
      if (adaptiveResult && adaptiveResult.nextQuestion) {
        interviewSessions.addAskedQuestion(session.id, adaptiveResult.nextQuestion.id);
      }
    }

    res.json({
      success: true,
      message: 'Interview invitation accepted. Board Room ready.',
      application: updated,
      sessionId: session.id
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
