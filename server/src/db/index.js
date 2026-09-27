const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, 'interview_sim.db');
const db = new Database(DB_PATH);

// Enable WAL mode for concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    domain TEXT NOT NULL,
    requiredSkills TEXT NOT NULL,
    level TEXT
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    skills TEXT NOT NULL,
    appliedPost TEXT NOT NULL,
    FOREIGN KEY (appliedPost) REFERENCES posts(id)
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    domain TEXT NOT NULL,
    stage TEXT NOT NULL,
    difficulty INTEGER NOT NULL,
    expectedConcepts TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS answers (
    id TEXT PRIMARY KEY,
    questionId TEXT NOT NULL,
    candidateId TEXT NOT NULL,
    text TEXT NOT NULL,
    aiRelevanceScore REAL DEFAULT 0.0,
    aiConceptCoverageScore REAL DEFAULT 0.0,
    manualScores TEXT DEFAULT '{}',
    notes TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    FOREIGN KEY (questionId) REFERENCES questions(id),
    FOREIGN KEY (candidateId) REFERENCES candidates(id)
  );

  CREATE TABLE IF NOT EXISTS question_relevance_cache (
    candidateId TEXT NOT NULL,
    questionId TEXT NOT NULL,
    relevanceScore REAL NOT NULL,
    updatedAt TEXT NOT NULL,
    PRIMARY KEY (candidateId, questionId)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    candidateId TEXT NOT NULL,
    postId TEXT NOT NULL,
    questionRelevanceAvg REAL NOT NULL,
    answerRelevanceAvg REAL NOT NULL,
    technicalKnowledgeScore REAL NOT NULL,
    depthScore REAL NOT NULL,
    communicationScore REAL NOT NULL,
    consistencyScore REAL NOT NULL,
    finalWeightedScore REAL NOT NULL,
    questionByQuestionEvidence TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (candidateId) REFERENCES candidates(id),
    FOREIGN KEY (postId) REFERENCES posts(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL, -- 'candidate' | 'expert' | 'admin'
    candidateId TEXT,   -- optional reference to candidates(id)
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS interview_sessions (
    id TEXT PRIMARY KEY,
    candidateId TEXT NOT NULL,
    postId TEXT NOT NULL,
    level TEXT DEFAULT 'Intermediate',
    type TEXT DEFAULT 'Techno-Managerial',
    duration INTEGER DEFAULT 45,
    adaptiveMode INTEGER DEFAULT 1,
    currentStage TEXT DEFAULT 'IceBreaking',
    currentQuestionIndex INTEGER DEFAULT 0,
    targetQuestionCount INTEGER DEFAULT 5,
    status TEXT DEFAULT 'active', -- 'active' | 'completed' | 'paused'
    askedQuestionIds TEXT DEFAULT '[]',
    startedAt TEXT NOT NULL,
    endedAt TEXT,
    FOREIGN KEY (candidateId) REFERENCES candidates(id),
    FOREIGN KEY (postId) REFERENCES posts(id)
  );

  CREATE TABLE IF NOT EXISTS coding_rooms (
    id TEXT PRIMARY KEY,
    profession TEXT NOT NULL,
    language TEXT DEFAULT 'python',
    challengeId TEXT,
    challengeTitle TEXT,
    challengeDescription TEXT,
    code TEXT NOT NULL,
    locked INTEGER DEFAULT 0,
    lastOutput TEXT DEFAULT '{}',
    candidateId TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS interview_transcripts (
    id TEXT PRIMARY KEY,
    interviewId TEXT NOT NULL,
    questionId TEXT,
    speaker TEXT NOT NULL, -- 'candidate' | 'interviewer' | 'ai'
    text TEXT NOT NULL,
    audioUrl TEXT,
    confidence REAL DEFAULT 1.0,
    engine TEXT DEFAULT 'speech-recognition',
    durationSeconds REAL DEFAULT 0.0,
    isFinal INTEGER DEFAULT 1,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (interviewId) REFERENCES interview_sessions(id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    candidateId TEXT NOT NULL,
    vacancyId TEXT NOT NULL,
    matchScore REAL NOT NULL,
    status TEXT NOT NULL,
    cvFileRef TEXT,
    appliedAt TEXT NOT NULL,
    scheduledAt TEXT
  );
`);

// Graceful schema migration for candidate columns
try {
  db.exec(`ALTER TABLE candidates ADD COLUMN resumeUrl TEXT;`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE candidates ADD COLUMN parsedProfile TEXT DEFAULT '{}';`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE candidates ADD COLUMN domainTags TEXT DEFAULT '[]';`);
} catch (e) {}

// Graceful schema migration for answer voice columns
try {
  db.exec(`ALTER TABLE answers ADD COLUMN inputMode TEXT DEFAULT 'text';`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE answers ADD COLUMN audioUrl TEXT;`);
} catch (e) {}



/**
 * Seed initial database records from JSON files if tables are empty.
 */
function seedDatabase() {
  const seedDir = path.resolve(__dirname, '../../seed-data');

  // 1. Seed Posts
  const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get().count;
  if (postCount === 0) {
    const postsFile = path.join(seedDir, 'posts.json');
    if (fs.existsSync(postsFile)) {
      const posts = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
      const insertPost = db.prepare(`
        INSERT INTO posts (id, title, domain, requiredSkills, level)
        VALUES (?, ?, ?, ?, ?)
      `);
      const insertMany = db.transaction((items) => {
        for (const p of items) {
          insertPost.run(p.id, p.title, p.domain, JSON.stringify(p.requiredSkills || []), p.level || '');
        }
      });
      insertMany(posts);
      console.log(`[DB] Seeded ${posts.length} post(s).`);
    }
  }

  // 2. Seed Candidates
  const candidateCount = db.prepare('SELECT COUNT(*) as count FROM candidates').get().count;
  if (candidateCount === 0) {
    const candidatesFile = path.join(seedDir, 'candidates.json');
    if (fs.existsSync(candidatesFile)) {
      const candidates = JSON.parse(fs.readFileSync(candidatesFile, 'utf8'));
      const insertCandidate = db.prepare(`
        INSERT INTO candidates (id, name, skills, appliedPost)
        VALUES (?, ?, ?, ?)
      `);
      const insertMany = db.transaction((items) => {
        for (const c of items) {
          insertCandidate.run(c.id, c.name, JSON.stringify(c.skills || []), c.appliedPost);
        }
      });
      insertMany(candidates);
      console.log(`[DB] Seeded ${candidates.length} candidate(s).`);
    }
  }

  // 3. Seed Questions
  const questionCount = db.prepare('SELECT COUNT(*) as count FROM questions').get().count;
  if (questionCount === 0) {
    const questionsFile = path.join(seedDir, 'questions.json');
    if (fs.existsSync(questionsFile)) {
      const questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));
      const insertQuestion = db.prepare(`
        INSERT INTO questions (id, text, domain, stage, difficulty, expectedConcepts)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const insertMany = db.transaction((items) => {
        for (const q of items) {
          insertQuestion.run(
            q.id,
            q.text,
            q.domain,
            q.stage,
            q.difficulty,
            JSON.stringify(q.expectedConcepts || [])
          );
        }
      });
      insertMany(questions);
      console.log(`[DB] Seeded ${questions.length} question(s).`);
    }
  }

  // 4. Seed Users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    const now = new Date().toISOString();

    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, candidateId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('usr-cand-1', 'Dr. Aarav Sharma', 'candidate@racsim.ai', defaultPasswordHash, 'candidate', 'cand-001', now);
    insertUser.run('usr-exp-1', 'Prof. Sunita Menon', 'expert@racsim.ai', defaultPasswordHash, 'expert', null, now);
    insertUser.run('usr-adm-1', 'System Administrator', 'admin@racsim.ai', defaultPasswordHash, 'admin', null, now);
    console.log('[DB] Seeded 3 default user accounts (candidate, expert, admin).');
  }
}

// Model access helpers
const users = {
  create: ({ id, name, email, password_hash, role, candidateId = null }) => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, candidateId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, email, password_hash, role, candidateId, now);
    return users.getById(id);
  },
  getByEmail: (email) => {
    return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) || null;
  },
  getById: (id) => {
    return db.prepare('SELECT id, name, email, role, candidateId, createdAt FROM users WHERE id = ?').get(id) || null;
  },
  getAll: () => {
    return db.prepare('SELECT id, name, email, role, candidateId, createdAt FROM users').all();
  },
};

const posts = {
  getAll: () => {
    const rows = db.prepare('SELECT * FROM posts').all();
    return rows.map((r) => ({
      ...r,
      requiredSkills: JSON.parse(r.requiredSkills || '[]'),
    }));
  },
  getById: (id) => {
    const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      requiredSkills: JSON.parse(row.requiredSkills || '[]'),
    };
  },
};

const candidates = {
  getAll: () => {
    const rows = db.prepare('SELECT * FROM candidates').all();
    return rows.map((r) => ({
      ...r,
      skills: JSON.parse(r.skills || '[]'),
      parsedProfile: JSON.parse(r.parsedProfile || '{}'),
      domainTags: JSON.parse(r.domainTags || '[]'),
    }));
  },
  getById: (id) => {
    const row = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      skills: JSON.parse(row.skills || '[]'),
      parsedProfile: JSON.parse(row.parsedProfile || '{}'),
      domainTags: JSON.parse(row.domainTags || '[]'),
    };
  },
  updateProfile: (id, { name, skills, appliedPost, resumeUrl, parsedProfile, domainTags }) => {
    const current = candidates.getById(id);
    if (!current) return null;

    const newName = name !== undefined ? name : current.name;
    const newSkills = skills !== undefined ? skills : current.skills;
    const newApplied = appliedPost !== undefined ? appliedPost : current.appliedPost;
    const newResumeUrl = resumeUrl !== undefined ? resumeUrl : current.resumeUrl;
    const newParsed = parsedProfile !== undefined ? parsedProfile : current.parsedProfile;
    const newDomains = domainTags !== undefined ? domainTags : current.domainTags;

    db.prepare(`
      UPDATE candidates
      SET name = ?,
          skills = ?,
          appliedPost = ?,
          resumeUrl = ?,
          parsedProfile = ?,
          domainTags = ?
      WHERE id = ?
    `).run(
      newName,
      JSON.stringify(newSkills),
      newApplied,
      newResumeUrl,
      JSON.stringify(newParsed),
      JSON.stringify(newDomains),
      id
    );
    return candidates.getById(id);
  },
  create: ({ id, name, skills = [], appliedPost = 'vac-ai-ml', resumeUrl = '', parsedProfile = {}, domainTags = [] }) => {
    const candId = id || `cand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO candidates (id, name, skills, appliedPost, resumeUrl, parsedProfile, domainTags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(candId, name, JSON.stringify(skills), appliedPost, resumeUrl, JSON.stringify(parsedProfile), JSON.stringify(domainTags));
    return candidates.getById(candId);
  },
};

const interviewSessions = {
  create: ({
    id,
    candidateId,
    postId,
    level = 'Intermediate',
    type = 'Techno-Managerial',
    duration = 45,
    adaptiveMode = true,
    targetQuestionCount = 5,
  }) => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO interview_sessions (
        id, candidateId, postId, level, type, duration, adaptiveMode,
        currentStage, currentQuestionIndex, targetQuestionCount, status,
        askedQuestionIds, startedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'IceBreaking', 0, ?, 'active', '[]', ?)
    `).run(
      id,
      candidateId,
      postId,
      level,
      type,
      duration,
      adaptiveMode ? 1 : 0,
      targetQuestionCount,
      now
    );
    return interviewSessions.getById(id);
  },
  getById: (id) => {
    const row = db.prepare('SELECT * FROM interview_sessions WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      adaptiveMode: Boolean(row.adaptiveMode),
      askedQuestionIds: JSON.parse(row.askedQuestionIds || '[]'),
    };
  },
  getAll: () => {
    const rows = db.prepare('SELECT * FROM interview_sessions ORDER BY startedAt DESC').all();
    return rows.map((r) => ({
      ...r,
      adaptiveMode: Boolean(r.adaptiveMode),
      askedQuestionIds: JSON.parse(r.askedQuestionIds || '[]'),
    }));
  },
  update: (id, updates) => {
    const session = interviewSessions.getById(id);
    if (!session) return null;

    const currentStage = updates.currentStage || session.currentStage;
    const currentQuestionIndex = updates.currentQuestionIndex !== undefined ? updates.currentQuestionIndex : session.currentQuestionIndex;
    const status = updates.status || session.status;
    const askedQuestionIds = updates.askedQuestionIds || session.askedQuestionIds;
    const endedAt = updates.endedAt || session.endedAt;

    db.prepare(`
      UPDATE interview_sessions
      SET currentStage = ?,
          currentQuestionIndex = ?,
          status = ?,
          askedQuestionIds = ?,
          endedAt = ?
      WHERE id = ?
    `).run(
      currentStage,
      currentQuestionIndex,
      status,
      JSON.stringify(askedQuestionIds),
      endedAt,
      id
    );
    return interviewSessions.getById(id);
  },
  addAskedQuestion: (id, questionId) => {
    const session = interviewSessions.getById(id);
    if (!session) return null;
    const list = session.askedQuestionIds || [];
    if (!list.includes(questionId)) {
      list.push(questionId);
    }
    return interviewSessions.update(id, {
      askedQuestionIds: list,
      currentQuestionIndex: list.length,
    });
  },
  complete: (id) => {
    return interviewSessions.update(id, {
      status: 'completed',
      endedAt: new Date().toISOString(),
    });
  },
};

const questions = {
  getAll: ({ stage, domain } = {}) => {
    let query = 'SELECT * FROM questions WHERE 1=1';
    const params = [];
    if (stage) {
      query += ' AND LOWER(stage) = LOWER(?)';
      params.push(stage);
    }
    if (domain) {
      query += ' AND LOWER(domain) LIKE LOWER(?)';
      params.push(`%${domain}%`);
    }
    const rows = db.prepare(query).all(...params);
    return rows.map((r) => ({
      ...r,
      expectedConcepts: JSON.parse(r.expectedConcepts || '[]'),
    }));
  },
  getById: (id) => {
    const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      expectedConcepts: JSON.parse(row.expectedConcepts || '[]'),
    };
  },
};

const answers = {
  getById: (id) => {
    const row = db.prepare('SELECT * FROM answers WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      inputMode: row.inputMode || 'text',
      audioUrl: row.audioUrl || null,
      manualScores: JSON.parse(row.manualScores || '{}'),
    };
  },
  getByCandidate: (candidateId) => {
    const rows = db.prepare('SELECT * FROM answers WHERE candidateId = ? ORDER BY createdAt ASC').all(candidateId);
    return rows.map((r) => ({
      ...r,
      inputMode: r.inputMode || 'text',
      audioUrl: r.audioUrl || null,
      manualScores: JSON.parse(r.manualScores || '{}'),
    }));
  },
  getByCandidateAndQuestion: (candidateId, questionId) => {
    const row = db.prepare('SELECT * FROM answers WHERE candidateId = ? AND questionId = ?').get(candidateId, questionId);
    if (!row) return null;
    return {
      ...row,
      inputMode: row.inputMode || 'text',
      audioUrl: row.audioUrl || null,
      manualScores: JSON.parse(row.manualScores || '{}'),
    };
  },
  save: ({ id, questionId, candidateId, text, aiRelevanceScore = 0.0, aiConceptCoverageScore = 0.0, manualScores = {}, notes = '', inputMode = 'text', audioUrl = null }) => {
    const existing = db.prepare('SELECT id FROM answers WHERE id = ?').get(id);
    const now = new Date().toISOString();
    if (existing) {
      db.prepare(`
        UPDATE answers
        SET text = ?,
            aiRelevanceScore = ?,
            aiConceptCoverageScore = ?,
            manualScores = ?,
            notes = ?,
            inputMode = ?,
            audioUrl = ?
        WHERE id = ?
      `).run(text, aiRelevanceScore, aiConceptCoverageScore, JSON.stringify(manualScores), notes, inputMode, audioUrl, id);
      return answers.getById(id);
    } else {
      db.prepare(`
        INSERT INTO answers (id, questionId, candidateId, text, aiRelevanceScore, aiConceptCoverageScore, manualScores, notes, inputMode, audioUrl, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, questionId, candidateId, text, aiRelevanceScore, aiConceptCoverageScore, JSON.stringify(manualScores), notes, inputMode, audioUrl, now);
      return answers.getById(id);
    }
  },
  updateManualScore: (id, { manualScores, notes }) => {
    db.prepare(`
      UPDATE answers
      SET manualScores = ?,
          notes = ?
      WHERE id = ?
    `).run(JSON.stringify(manualScores), notes, id);
    return answers.getById(id);
  },
};

const questionRelevanceCache = {
  get: (candidateId, questionId) => {
    return db.prepare('SELECT relevanceScore FROM question_relevance_cache WHERE candidateId = ? AND questionId = ?').get(candidateId, questionId);
  },
  set: (candidateId, questionId, relevanceScore) => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO question_relevance_cache (candidateId, questionId, relevanceScore, updatedAt)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(candidateId, questionId) DO UPDATE SET
        relevanceScore = excluded.relevanceScore,
        updatedAt = excluded.updatedAt
    `).run(candidateId, questionId, relevanceScore, now);
  },
};

const reports = {
  save: (reportData) => {
    const {
      id,
      candidateId,
      postId,
      questionRelevanceAvg,
      answerRelevanceAvg,
      technicalKnowledgeScore,
      depthScore,
      communicationScore,
      consistencyScore,
      finalWeightedScore,
      questionByQuestionEvidence,
    } = reportData;

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO reports (
        id, candidateId, postId, questionRelevanceAvg, answerRelevanceAvg,
        technicalKnowledgeScore, depthScore, communicationScore, consistencyScore,
        finalWeightedScore, questionByQuestionEvidence, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        questionRelevanceAvg = excluded.questionRelevanceAvg,
        answerRelevanceAvg = excluded.answerRelevanceAvg,
        technicalKnowledgeScore = excluded.technicalKnowledgeScore,
        depthScore = excluded.depthScore,
        communicationScore = excluded.communicationScore,
        consistencyScore = excluded.consistencyScore,
        finalWeightedScore = excluded.finalWeightedScore,
        questionByQuestionEvidence = excluded.questionByQuestionEvidence,
        createdAt = excluded.createdAt
    `).run(
      id,
      candidateId,
      postId,
      questionRelevanceAvg,
      answerRelevanceAvg,
      technicalKnowledgeScore,
      depthScore,
      communicationScore,
      consistencyScore,
      finalWeightedScore,
      JSON.stringify(questionByQuestionEvidence),
      now
    );

    return reports.getById(id);
  },
  getById: (id) => {
    const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
    if (!row) return null;
    const evidence = JSON.parse(row.questionByQuestionEvidence || '[]');
    const cand = candidates.getById(row.candidateId);
    const pst = posts.getById(row.postId);
    return {
      ...row,
      candidateName: cand ? cand.name : 'Unknown Candidate',
      postTitle: pst ? pst.title : 'Unknown Post',
      totalQuestionsAnswered: evidence.length,
      weightsUsed: {
        questionRelevance: 0.10,
        answerRelevance: 0.25,
        technicalKnowledge: 0.35,
        depthCompleteness: 0.15,
        communication: 0.10,
        consistency: 0.05,
      },
      questionByQuestionEvidence: evidence,
    };
  },
  getByCandidateAndPost: (candidateId, postId) => {
    const row = db.prepare(`
      SELECT * FROM reports
      WHERE candidateId = ? AND postId = ?
      ORDER BY createdAt DESC LIMIT 1
    `).get(candidateId, postId);
    if (!row) return null;
    return reports.getById(row.id);
  },
};

const codingRooms = {
  create: ({ id, profession, language = 'python', challengeId = null, challengeTitle = '', challengeDescription = '', code = '', candidateId = null }) => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO coding_rooms (
        id, profession, language, challengeId, challengeTitle, challengeDescription,
        code, locked, lastOutput, candidateId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, '{}', ?, ?, ?)
    `).run(id, profession, language, challengeId, challengeTitle, challengeDescription, code, candidateId, now, now);
    return codingRooms.getById(id);
  },
  getById: (id) => {
    const row = db.prepare('SELECT * FROM coding_rooms WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      locked: Boolean(row.locked),
      lastOutput: JSON.parse(row.lastOutput || '{}'),
    };
  },
  updateCode: (id, code) => {
    const now = new Date().toISOString();
    db.prepare('UPDATE coding_rooms SET code = ?, updatedAt = ? WHERE id = ?').run(code, now, id);
    return codingRooms.getById(id);
  },
  updateOutput: (id, output) => {
    const now = new Date().toISOString();
    db.prepare('UPDATE coding_rooms SET lastOutput = ?, updatedAt = ? WHERE id = ?').run(JSON.stringify(output), now, id);
    return codingRooms.getById(id);
  },
  setLock: (id, locked) => {
    const now = new Date().toISOString();
    db.prepare('UPDATE coding_rooms SET locked = ?, updatedAt = ? WHERE id = ?').run(locked ? 1 : 0, now, id);
    return codingRooms.getById(id);
  },
  getAll: () => {
    const rows = db.prepare('SELECT * FROM coding_rooms ORDER BY updatedAt DESC').all();
    return rows.map((r) => ({
      ...r,
      locked: Boolean(r.locked),
      lastOutput: JSON.parse(r.lastOutput || '{}'),
    }));
  },
};

const transcripts = {
  create: ({ id, interviewId, questionId = null, speaker = 'candidate', text, audioUrl = null, confidence = 1.0, engine = 'speech-recognition', durationSeconds = 0.0, isFinal = true }) => {
    const tid = id || `tr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO interview_transcripts (
        id, interviewId, questionId, speaker, text, audioUrl, confidence, engine, durationSeconds, isFinal, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tid, interviewId, questionId, speaker, text, audioUrl, confidence, engine, durationSeconds, isFinal ? 1 : 0, now);
    return transcripts.getById(tid);
  },
  getById: (id) => {
    const row = db.prepare('SELECT * FROM interview_transcripts WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      isFinal: Boolean(row.isFinal),
    };
  },
  getByInterview: (interviewId) => {
    const rows = db.prepare('SELECT * FROM interview_transcripts WHERE interviewId = ? ORDER BY createdAt ASC').all(interviewId);
    return rows.map((r) => ({
      ...r,
      isFinal: Boolean(r.isFinal),
    }));
  },
  getByQuestion: (interviewId, questionId) => {
    const rows = db.prepare('SELECT * FROM interview_transcripts WHERE interviewId = ? AND questionId = ? ORDER BY createdAt ASC').all(interviewId, questionId);
    return rows.map((r) => ({
      ...r,
      isFinal: Boolean(r.isFinal),
    }));
  },
};

const applications = {
  create: ({ id, candidateId, vacancyId, matchScore, status = 'Pending Schedule', cvFileRef = '', appliedAt, scheduledAt = null }) => {
    const appId = id || `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const appliedTime = appliedAt || new Date().toISOString();
    db.prepare(`
      INSERT INTO applications (id, candidateId, vacancyId, matchScore, status, cvFileRef, appliedAt, scheduledAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(appId, candidateId, vacancyId, Number(matchScore) || 75, status, cvFileRef, appliedTime, scheduledAt);
    return applications.getById(appId);
  },
  getAll: () => {
    return db.prepare('SELECT * FROM applications ORDER BY appliedAt DESC').all();
  },
  getById: (id) => {
    return db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  },
  updateSchedule: (id, scheduledAt) => {
    db.prepare(`
      UPDATE applications
      SET status = 'Interview Scheduled', scheduledAt = ?
      WHERE id = ?
    `).run(scheduledAt, id);
    return applications.getById(id);
  },
  updateStatus: (id, status) => {
    db.prepare(`
      UPDATE applications
      SET status = ?
      WHERE id = ?
    `).run(status, id);
    return applications.getById(id);
  },
};

module.exports = {
  db,
  seedDatabase,
  users,
  posts,
  candidates,
  questions,
  answers,
  applications,
  interviewSessions,
  codingRooms,
  transcripts,
  questionRelevanceCache,
  reports,
};

