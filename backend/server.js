const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { vacancies, candidates, applications } = require('./dataStore');
const { SKILLS_TAXONOMY } = require('./skillsTaxonomy');
const { parseCvFile } = require('./services/parserService');
const { computeVacancyMatch } = require('./services/embeddingService');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded CV files statically for "View CV" action
app.use('/uploads', express.static(uploadsDir));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);
    const ext = path.extname(file.originalname);
    cb(null, `cv-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.docx', '.doc', '.txt'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are supported.'));
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Selector-Applicant Simulation Software Backend',
    timestamp: new Date().toISOString()
  });
});

// GET /api/taxonomy - list all known skills
app.get('/api/taxonomy', (req, res) => {
  res.json({
    total: SKILLS_TAXONOMY.length,
    skills: SKILLS_TAXONOMY.map(s => s.name)
  });
});

// POST /api/cv/upload - Accepts file, extracts text, matches against skills taxonomy, returns extracted skills list
app.post('/api/cv/upload', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CV file uploaded.' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    console.log(`[Upload] Received file: ${fileName} -> ${filePath}`);

    // Parse CV and match skills
    const parsedData = await parseCvFile(filePath);

    // Create Candidate Record
    const candidateId = 'cand-' + crypto.randomUUID().slice(0, 8);
    const candidateRecord = {
      id: candidateId,
      name: parsedData.candidateName || fileName.replace(/\.[^/.]+$/, ''),
      email: parsedData.email || 'candidate@example.com',
      extractedSkills: parsedData.detectedSkills || [],
      cvFileRef: `/uploads/${path.basename(filePath)}`,
      originalFileName: fileName,
      createdAt: new Date().toISOString()
    };

    candidates.unshift(candidateRecord);

    console.log(`[Upload] Extracted ${parsedData.detectedSkills.length} skills for ${candidateRecord.name}:`, parsedData.detectedSkills);

    res.json({
      success: true,
      candidateId: candidateRecord.id,
      candidate: candidateRecord,
      extractedSkills: candidateRecord.extractedSkills,
      cvFileRef: candidateRecord.cvFileRef,
      originalFileName: candidateRecord.originalFileName,
      textPreview: parsedData.textPreview
    });
  } catch (error) {
    console.error('[Upload Error]', error);
    res.status(500).json({
      error: 'Failed to process CV file.',
      details: error.message
    });
  }
});

// GET /api/vacancies - List all open vacancies with required skills
app.get('/api/vacancies', (req, res) => {
  res.json(vacancies);
});

// POST /api/vacancies/match - body: { candidateSkills, vacancyId }
// Returns match score using shared AI embedding service or fallback
app.post('/api/vacancies/match', async (req, res) => {
  try {
    const { candidateSkills = [], vacancyId } = req.body;

    if (vacancyId) {
      const vacancy = vacancies.find(v => v.id === vacancyId);
      if (!vacancy) {
        return res.status(404).json({ error: 'Vacancy not found' });
      }
      const matchResult = await computeVacancyMatch(candidateSkills, vacancy);
      return res.json({
        vacancyId: vacancy.id,
        vacancyTitle: vacancy.title,
        ...matchResult
      });
    }

    // If no specific vacancyId provided, match across ALL vacancies and return sorted list
    const scoredVacancies = await Promise.all(
      vacancies.map(async (v) => {
        const matchResult = await computeVacancyMatch(candidateSkills, v);
        return {
          ...v,
          matchScore: matchResult.matchScore,
          matchAlgorithm: matchResult.algorithm,
          exactMatches: matchResult.exactMatches,
          missingSkills: matchResult.missingSkills,
          isAiPowered: matchResult.isAiPowered
        };
      })
    );

    // Sort descending by matchScore
    scoredVacancies.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      scoredVacancies
    });
  } catch (error) {
    console.error('[Match Error]', error);
    res.status(500).json({ error: 'Failed to compute vacancy match score.' });
  }
});

// POST /api/applications - Creates an application record
app.post('/api/applications', (req, res) => {
  try {
    const { candidateId, vacancyId, matchScore, cvFileRef } = req.body;

    if (!candidateId || !vacancyId) {
      return res.status(400).json({ error: 'candidateId and vacancyId are required.' });
    }

    // Verify candidate and vacancy exist
    const candidate = candidates.find(c => c.id === candidateId);
    const vacancy = vacancies.find(v => v.id === vacancyId);

    if (!vacancy) {
      return res.status(404).json({ error: 'Vacancy not found.' });
    }

    const newApp = {
      id: 'app-' + crypto.randomUUID().slice(0, 8),
      candidateId,
      vacancyId,
      matchScore: Number(matchScore) || 75,
      status: 'Pending Schedule',
      cvFileRef: cvFileRef || candidate?.cvFileRef || '',
      appliedAt: new Date().toISOString(),
      scheduledAt: null
    };

    applications.unshift(newApp);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      application: newApp
    });
  } catch (error) {
    console.error('[Application Error]', error);
    res.status(500).json({ error: 'Failed to create application.' });
  }
});

// GET /api/applications - List all applications (for interviewer dashboard)
app.get('/api/applications', (req, res) => {
  try {
    const enriched = applications.map(appItem => {
      const candidate = candidates.find(c => c.id === appItem.candidateId);
      const vacancy = vacancies.find(v => v.id === appItem.vacancyId);

      return {
        ...appItem,
        candidateName: candidate ? candidate.name : 'Unknown Candidate',
        candidateEmail: candidate ? candidate.email : 'N/A',
        candidateSkills: candidate ? candidate.extractedSkills : [],
        originalFileName: candidate ? candidate.originalFileName : 'Resume.pdf',
        cvFileRef: appItem.cvFileRef || candidate?.cvFileRef || '',
        vacancyTitle: vacancy ? vacancy.title : 'Unspecified Post',
        vacancyDomain: vacancy ? vacancy.domain : 'General',
        vacancyLevel: vacancy ? vacancy.level : 'Mid-Level',
        requiredSkills: vacancy ? vacancy.requiredSkills : []
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('[Get Applications Error]', error);
    res.status(500).json({ error: 'Failed to retrieve applications.' });
  }
});

// PATCH /api/applications/:id/schedule - body: { scheduledAt }
app.patch('/api/applications/:id/schedule', (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({ error: 'scheduledAt datetime is required.' });
    }

    const appIndex = applications.findIndex(a => a.id === id);
    if (appIndex === -1) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    applications[appIndex].status = 'Interview Scheduled';
    applications[appIndex].scheduledAt = scheduledAt;

    res.json({
      success: true,
      message: 'Interview scheduled successfully.',
      application: applications[appIndex]
    });
  } catch (error) {
    console.error('[Schedule Error]', error);
    res.status(500).json({ error: 'Failed to schedule interview.' });
  }
});

// Start express server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Selector-Applicant Simulation Software Backend API`);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
