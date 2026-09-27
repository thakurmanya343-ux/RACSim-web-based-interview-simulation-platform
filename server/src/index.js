const express = require('express');
const cors = require('cors');
const path = require('path');
const { seedDatabase } = require('./db');

const postsRouter = require('./routes/posts');
const vacanciesRouter = require('./routes/vacancies');
const applicationsRouter = require('./routes/applications');
const cvRouter = require('./routes/cv');
const candidatesRouter = require('./routes/candidates');
const questionsRouter = require('./routes/questions');
const scoringRouter = require('./routes/scoring');
const manualScoreRouter = require('./routes/manualScore');
const reportRouter = require('./routes/report');
const answersRouter = require('./routes/answers');
const authRouter = require('./routes/auth');
const interviewsRouter = require('./routes/interviews');
const auditRouter = require('./routes/audit');
const codingRouter = require('./routes/coding');
const audioRouter = require('./routes/audio');
const { executeCode } = require('./services/executionService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger for development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Seed database on startup
seedDatabase();

// Base routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'interview-simulation-backend',
    storageDrive: 'E:',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api', (req, res) => {
  res.json({
    service: 'Web-Based Selector-Applicant Simulation Software Backend (RACSim PSWB01)',
    version: '2.1.0',
    endpoints: [
      { method: 'POST', path: '/api/auth/register', description: 'Register user (candidate, expert, admin)' },
      { method: 'POST', path: '/api/auth/login', description: 'Login & receive JWT' },
      { method: 'GET', path: '/api/auth/me', description: 'Get authenticated user' },
      { method: 'GET', path: '/api/posts', description: 'List job posts' },
      { method: 'GET', path: '/api/candidates/:id', description: 'Get candidate profile' },
      { method: 'POST', path: '/api/candidates/:id/resume', description: 'Upload/parse CV and extract skills' },
      { method: 'GET', path: '/api/questions?stage=&domain=', description: 'Filter question bank' },
      { method: 'GET', path: '/api/questions/recommend', description: 'Recommend questions based on candidate skills' },
      { method: 'POST', path: '/api/interviews', description: 'Create Board Room interview session' },
      { method: 'GET', path: '/api/interviews/:id', description: 'Get live session state' },
      { method: 'POST', path: '/api/interviews/:id/next-question', description: 'Adaptive next question engine' },
      { method: 'POST', path: '/api/interviews/:id/answers', description: 'Submit answer in session' },
      { method: 'POST', path: '/api/interviews/:id/finish', description: 'Complete session & generate report' },
      { method: 'GET', path: '/api/interviews/:id/report/pdf', description: 'Download PDF dossier for session' },
      { method: 'POST', path: '/api/coding/room', description: 'Open live coding room for selected profession' },
      { method: 'GET', path: '/api/coding/room/:id', description: 'Interviewer live view of candidate code' },
      { method: 'POST', path: '/api/coding/room/:id/code', description: 'Candidate syncs live code' },
      { method: 'POST', path: '/api/coding/room/:id/lock', description: 'Interviewer locks/unlocks code editor' },
      { method: 'POST', path: '/api/coding/run-code', description: 'Execute candidate code in live sandbox' },
      { method: 'POST', path: '/api/run-code', description: 'Direct runner compatible with Pair Programming Canvas' },
      { method: 'POST', path: '/api/score/question-relevance', description: 'Candidate skills vs Question relevance' },
      { method: 'POST', path: '/api/score/answer-evaluation', description: 'AI answer relevance & concept coverage' },
      { method: 'POST', path: '/api/manual-score', description: 'Store expert manual scores' },
      { method: 'POST', path: '/api/report/generate', description: 'Generate final weighted report' },
      { method: 'GET', path: '/api/report/:candidateId/:postId', description: 'Get generated report' },
      { method: 'GET', path: '/api/report/:candidateId/:postId/pdf', description: 'Download generated report as PDF' },
      { method: 'GET', path: '/api/admin/audit/expert-consistency', description: 'Expert bias and consistency audit metrics' },
    ],
  });
});

// Mount modular routers
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/vacancies', vacanciesRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/cv', cvRouter);
app.use('/api/candidates', candidatesRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/coding', codingRouter);
app.use('/api/score', scoringRouter);
app.use('/api/manual-score', manualScoreRouter);
app.use('/api/report', reportRouter);
app.use('/api/answers', answersRouter);
app.use('/api/admin/audit', auditRouter);
app.use('/api/audio', audioRouter);

// Direct compatibility runner for Pair Programming Canvas frontend
app.post('/api/run-code', async (req, res) => {
  try {
    const { language = 'python', code = '' } = req.body;
    const result = await executeCode({ language, code });
    res.json(result);
  } catch (error) {
    res.status(500).json({ stdout: '', stderr: error.message, status: 'error', time: '0.00s', memory: '0 KB' });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint '${req.method} ${req.originalUrl}' not found.`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message,
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` Interview Simulation Backend running on port ${PORT}`);
    console.log(` Base API URL: http://localhost:${PORT}/api`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
