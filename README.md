# RACSim — Web-Based Selector-Applicant Interview Simulation Platform
### PSWB01 | Internal Hackathon 2026–27 | Backend & AI Layer

A recruitment and assessment interview simulation platform designed around **PSWB01**. The platform provides an authentic Board Room interview experience progressing from ice-breaking questions to deep techno-managerial evaluations, powered by local semantic embeddings, dynamic adaptive questioning, explainable scoring evidence, expert control/overrides, CV parsing, and instant official PDF evaluation dossiers.

---

## 🏛️ System Architecture

```
                    ┌─────────────────────────┐
                    │    Frontend Clients     │
                    │ Person 1 (Candidate UI) │
                    │ Person 2 (Expert UI)    │
                    └───────────┬─────────────┘
                                │ HTTP / JSON (Port 5000)
                                ▼
         ┌──────────────────────────────────────────────┐
         │              Node.js + Express               │
         │                API Gateway                   │
         │  - JWT Auth & Role-Based Access Control      │
         │  - Auto-seeding SQLite (better-sqlite3)      │
         │  - Board Room Session Orchestration          │
         │  - Dynamic Adaptive Questioning Engine       │
         │  - 10/25/35/15/10/5 Weighted Scoring Model   │
         │  - Pure JS Printable PDF Dossier Generator   │
         │  - Expert Scoring Consistency & Bias Audit   │
         └──────────────┬───────────────────────────────┘
                        │
                        │ HTTP / JSON (Port 8000)
                        │ (Internal Localhost)
                        ▼
         ┌──────────────────────────────────────────────┐
         │             Python + FastAPI                 │
         │             AI Scoring Service               │
         │  - HuggingFace `all-MiniLM-L6-v2`            │
         │  - Cosine Similarity & Dense Embeddings      │
         │  - Batch Expected Concept Coverage Engine    │
         │  - CV / Resume Entity & Skill Parser         │
         └──────────────────────────────────────────────┘
```

---

## 🔑 Pre-Seeded Demonstration Accounts

For quick hackathon judging and testing, the database automatically seeds three accounts with password `password123`:

| Role | Email | Password | Linked Profile |
|---|---|---|---|
| **Candidate** | `candidate@racsim.ai` | `password123` | Dr. Aarav Sharma (`cand-001`) |
| **Expert / Panel** | `expert@racsim.ai` | `password123` | Prof. Sunita Menon (Panelist) |
| **Administrator** | `admin@racsim.ai` | `password123` | System Administrator |

---

## 🚀 Running the Services

### 1. Python AI Microservice (Port 8000)
```powershell
cd ai-service
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
*Loads `all-MiniLM-L6-v2` once into memory at startup.*

### 2. Node.js Express Server (Port 5000)
```powershell
cd server
npm start
```
*Auto-seeds database and listens on `http://localhost:5000/api`.*

### 3. Run Full Blueprint Test Suite
```powershell
cd server
npm run test:blueprint
```
*Runs all 10 modules: Auth, CV parsing, Recommendations, Sessions, Adaptive difficulty, AI scoring, Expert rubrics, Final report, PDF generation, and Bias audit.*

---

## 📊 Exact Scoring Rubric & Weights

$$\text{Final Score} = 0.10 \times \text{Question Rel} + 0.25 \times \text{Answer Rel} + 0.35 \times \text{Tech Knowledge} + 0.15 \times \text{Depth} + 0.10 \times \text{Communication} + 0.05 \times \text{Consistency}$$

| Dimension | Weight | Source | Description |
|---|---|---|---|
| **Question Relevance** | **10%** | AI Cosine Similarity | Candidate skills matched against question text |
| **Answer Relevance** | **25%** | AI Cosine Similarity | Candidate response matched against question text |
| **Technical Knowledge** | **35%** | Expert Manual (0–100) | Conceptual precision & domain correctness |
| **Depth / Completeness** | **15%** | Expert Manual (0–100) | Coverage of edge cases & nuances |
| **Communication Clarity**| **10%** | Expert Manual (0–100) | Structure, articulation, and clarity |
| **Consistency** | **5%** | Expert Manual (0–100) | Alignment across answers throughout interview |

---

## 📡 API Directory for Frontend Teammates

Base URL: `http://localhost:5000/api`

### 👤 Category 1: For Person 1 (Candidate UI)

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Register new candidate account |
| `POST` | `/api/auth/login` | Login and receive Bearer JWT token |
| `GET` | `/api/candidates/:id` | Get candidate profile, skills, and applied post |
| `POST` | `/api/candidates/:id/resume` | Upload & parse CV (multipart file or JSON `{ resumeText }`) |
| `GET` | `/api/interviews/:id` | View active Board Room session state |
| `POST` | `/api/interviews/:id/answers` | Submit candidate answer to current question |
| `GET` | `/api/report/:candidateId/:postId` | View final interview evaluation scorecard |
| `GET` | `/api/report/:candidateId/:postId/pdf` | Download official printable PDF evaluation dossier |

### 👤 Category 2: For Person 2 (Expert & Admin UI)

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Login as Expert or Admin |
| `GET` | `/api/posts` | List job posts (*"Scientist B"*) |
| `GET` | `/api/questions` | Filter question bank by stage or domain |
| `GET` | `/api/questions/recommend` | Recommend questions matching candidate CV skills |
| `POST` | `/api/interviews` | Create new interview session (select level, type, adaptiveMode: true) |
| `POST` | `/api/score/question-relevance` | Calculate AI relevance between candidate skills & question |
| `POST` | `/api/score/answer-evaluation` | Calculate AI relevance + concept coverage ("Why this score?") |
| `POST` | `/api/manual-score` | Submit expert ratings (Tech, Depth, Comm, Consistency) + notes |
| `POST` | `/api/interviews/:id/next-question` | Adaptive Engine: dynamically select next leveled question |
| `POST` | `/api/interviews/:id/finish` | Conclude session and compute final weighted report |
| `GET` | `/api/admin/audit/expert-consistency` | View panel scoring variance, distribution & bias flags |

---

## 🎯 Explainable AI ("Why This Score?") Sample Response
```json
{
  "success": true,
  "relevanceScore": 34.27,
  "conceptCoverageScore": 80.0,
  "coveredConcepts": ["CNN", "feature extraction", "spatial hierarchy", "parameter sharing"],
  "missedConcepts": ["receptive field"],
  "conceptDetails": [
    { "concept": "CNN", "similarity": 0.85, "covered": true },
    { "concept": "feature extraction", "similarity": 0.85, "covered": true },
    { "concept": "spatial hierarchy", "similarity": 0.85, "covered": true },
    { "concept": "parameter sharing", "similarity": 0.85, "covered": true },
    { "concept": "receptive field", "similarity": 0.312, "covered": false }
  ]
}
```

---

## 🧠 Adaptive Questioning Engine Decision Sample
```json
{
  "nextQuestion": {
    "id": "q-14",
    "stage": "AdvancedTechnical",
    "difficulty": 4,
    "text": "Compare Vision Transformers (ViT) with Convolutional Neural Networks (CNN) in terms of inductive bias and sample efficiency."
  },
  "adaptiveReasoning": {
    "previousScore": 92.5,
    "nextAction": "increase_difficulty",
    "targetStage": "AdvancedTechnical",
    "targetDifficulty": 4,
    "explanation": "Candidate demonstrated strong competence (score: 92.5%). System increased difficulty to Level 4 in AdvancedTechnical."
  }
}
```

---

## 🛡️ Offline AI Resilience
If the Python microservice is stopped or unreachable, the Node API catches errors gracefully, executes a local heuristic tokenization fallback, sets `"isFallback": true`, and **never crashes or returns 500**.
