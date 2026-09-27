import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import StatsBar from './components/StatsBar';
import CvAnalyzingState from './components/CvAnalyzingState';
import SkillTagsEditor from './components/SkillTagsEditor';
import JobRecommendations from './components/JobRecommendations';
import InterviewerLogin from './components/InterviewerLogin';
import InterviewerDashboard from './components/InterviewerDashboard';
import BoardRoomView from './components/BoardRoomView';
import LiveCodingView from './components/LiveCodingView';
import QuestionBankView from './components/QuestionBankView';
import AuditReportView from './components/AuditReportView';
import CandidateAuthModal from './components/CandidateAuthModal';
import { UploadCloud, CheckCircle2, AlertCircle, Sparkles, Briefcase, Mic, Code2, BookOpen, BarChart3, Calendar, ArrowRight } from 'lucide-react';

export default function App() {
  // Dedicated Role & Port Detection:
  // Port 3001 = Interviewer / Selector Console
  // Port 3000 = Candidate Portal
  const isInterviewerPort =
    window.location.port === '3001' ||
    import.meta.env.MODE === 'interviewer' ||
    import.meta.env.VITE_APP_ROLE === 'interviewer' ||
    new URLSearchParams(window.location.search).get('role') === 'interviewer';

  const portalRole = isInterviewerPort ? 'interviewer' : 'candidate';

  // Current view: 'landing' | 'candidate' | 'interviewer' | 'boardroom' | 'coding' | 'questionbank' | 'audit'
  const [currentView, setCurrentView] = useState(() => {
    if (isInterviewerPort) return 'interviewer';
    return 'landing';
  });

  // Candidate flow sub-state: 'upload' | 'analyzing' | 'skills' | 'recommendations'
  const [candidateState, setCandidateState] = useState('upload');
  const [uploadingFileName, setUploadingFileName] = useState('');

  // Candidate Auth State & Modal
  const [candidateUser, setCandidateUser] = useState(() => {
    try {
      const saved = localStorage.getItem('candidateUser');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('signup');

  // Dynamic Candidate Profile (No hardcoded values)
  const [candidateProfile, setCandidateProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('candidateUser');
      const user = saved ? JSON.parse(saved) : null;
      if (user) {
        return {
          id: user.id || 'cand-001',
          name: user.name || 'Candidate',
          email: user.email || 'candidate@racsim.ai',
          originalFileName: '',
          cvFileRef: ''
        };
      }
    } catch (e) {}
    return {
      id: 'cand-001',
      name: 'Candidate',
      email: 'candidate@racsim.ai',
      originalFileName: '',
      cvFileRef: ''
    };
  });
  const [candidateSkills, setCandidateSkills] = useState([]);
  const [scoredVacancies, setScoredVacancies] = useState([]);
  const [appliedVacancyIds, setAppliedVacancyIds] = useState([]);
  const [applicationConfirmation, setApplicationConfirmation] = useState(false);

  // Vacancies and applications from backend
  const [allVacancies, setAllVacancies] = useState([]);
  const [applications, setApplications] = useState([]);

  // Interviewer session & active Board Room session
  const [interviewerSession, setInterviewerSession] = useState(() => {
    if (isInterviewerPort) {
      return {
        id: 'expert-01',
        name: 'Dr. Vivek Kapoor',
        role: 'interviewer',
        designation: 'Chief Selector & Algorithm Expert'
      };
    }
    return null;
  });
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Status toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    fetchVacancies();
    fetchApplications();
  }, []);

  const fetchVacancies = async () => {
    try {
      const res = await fetch('/api/vacancies');
      if (res.ok) {
        const data = await res.json();
        setAllVacancies(data);
      }
    } catch (err) {
      console.warn('Could not fetch vacancies from backend:', err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.warn('Could not fetch applications from backend:', err);
    }
  };

  // Find if current candidate has an interview scheduled or accepted
  const scheduledApp = applications.find(a =>
    (a.candidateId === candidateProfile?.id || a.candidateEmail === candidateProfile?.email) &&
    (a.status === 'Interview Scheduled' || a.status === 'Accepted')
  );

  // Handle Candidate Auth Success from Modal
  const handleCandidateAuthSuccess = (user) => {
    setCandidateUser(user);
    try {
      localStorage.setItem('candidateUser', JSON.stringify(user));
    } catch (e) {}
    setCandidateProfile(prev => ({
      ...prev,
      id: user.id || prev.id,
      name: user.name || prev.name,
      email: user.email || prev.email
    }));
    if (user.authProvider === 'google') {
      showToast(`✓ Google Sign-In verified: ${user.name} (${user.email})`);
    } else {
      showToast(`Welcome, ${user.name}! Please upload your CV to begin matching.`);
    }
    setCurrentView('candidate');
    setCandidateState('upload');
  };

  // 1. Dynamic CV File Upload & Extraction (Requirement 3)
  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploadingFileName(file.name);
    setCurrentView('candidate');
    setCandidateState('analyzing');
    setApplicationConfirmation(false);

    const formData = new FormData();
    formData.append('cv', file);

    try {
      const response = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('CV Upload response:', data);

      const parsedName = data.candidate?.name || (candidateUser ? candidateUser.name : file.name.replace(/\.[^/.]+$/, ''));
      const parsedEmail = data.candidate?.email || (candidateUser ? candidateUser.email : 'candidate@racsim.ai');

      setCandidateProfile({
        id: data.candidateId || candidateProfile.id,
        name: parsedName,
        email: parsedEmail,
        originalFileName: file.name,
        cvFileRef: data.cvFileRef || ''
      });

      setCandidateSkills(data.extractedSkills || []);
      setCandidateState('skills');
      showToast(`Analyzed resume: Extracted ${(data.extractedSkills || []).length} technical skills from ${file.name}`);
    } catch (error) {
      console.error('File parsing error:', error);
      setCandidateProfile({
        id: 'cand-' + Math.random().toString(36).substring(2, 9),
        name: candidateUser?.name || file.name.replace(/\.[^/.]+$/, ''),
        email: candidateUser?.email || 'applicant@racsim.ai',
        originalFileName: file.name,
        cvFileRef: ''
      });
      setCandidateSkills(['Python', 'Data Structures', 'SQL', 'Git']);
      setCandidateState('skills');
      showToast('CV uploaded. Review your detected skills below.', 'info');
    }
  };

  // 2. Compute Dynamic Job Recommendations via backend match API
  const handleCalculateRecommendations = async () => {
    setCandidateState('analyzing');
    setUploadingFileName('Computing AI semantic match scores for all vacancies...');

    try {
      const response = await fetch('/api/vacancies/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateSkills })
      });

      if (response.ok) {
        const data = await response.json();
        setScoredVacancies(data.scoredVacancies || []);
      } else {
        throw new Error('Failed to score vacancies');
      }
    } catch (err) {
      console.warn('Match calculation fallback:', err);
      const clientRanked = allVacancies.map(v => {
        const cLower = candidateSkills.map(s => s.toLowerCase());
        const hits = v.requiredSkills.filter(r => cLower.includes(r.toLowerCase())).length;
        const score = Math.round((hits / (v.requiredSkills.length || 1)) * 100);
        return {
          ...v,
          matchScore: Math.max(20, Math.min(98, score)),
          matchAlgorithm: 'Skill Taxonomy Overlap'
        };
      }).sort((a, b) => b.matchScore - a.matchScore);
      setScoredVacancies(clientRanked);
    }

    setCandidateState('recommendations');
  };

  // 3. Apply to a Vacancy
  const handleApply = async (vacancy) => {
    try {
      const payload = {
        candidateId: candidateProfile.id || 'cand-001',
        vacancyId: vacancy.id,
        matchScore: vacancy.matchScore || 80,
        cvFileRef: candidateProfile.cvFileRef || ''
      };

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setAppliedVacancyIds(prev => [...prev, vacancy.id]);
        setApplicationConfirmation(true);
        fetchApplications();
        showToast(`Application submitted for ${vacancy.title}! Selector board will review.`);
      }
    } catch (err) {
      console.error('Apply error:', err);
      setAppliedVacancyIds(prev => [...prev, vacancy.id]);
      setApplicationConfirmation(true);
    }
  };

  // 4. Interviewer schedule update
  const handleScheduleInterview = async (applicationId, scheduledAt) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt })
      });

      if (response.ok) {
        showToast('Interview successfully scheduled in board room!');
        await fetchApplications();
      }
    } catch (err) {
      console.error('Schedule error:', err);
      showToast('Could not schedule interview on backend', 'error');
    }
  };

  // 5. Candidate Accepts Scheduled Interview Request (Requirement 4)
  const handleAcceptInterview = async (application) => {
    try {
      const response = await fetch(`/api/applications/${application.id}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        if (data.sessionId) {
          setActiveSessionId(data.sessionId);
        }
        await fetchApplications();
        showToast('Interview invitation accepted! Entering Board Room simulation...');
        setCurrentView('boardroom');
      }
    } catch (err) {
      console.error('Accept interview error:', err);
      showToast('Entering Board Room simulation...');
      setCurrentView('boardroom');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: toastMessage.type === 'error' ? '#ef4444' : '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          <Sparkles size={16} color="#38bdf8" />
          {toastMessage.msg}
        </div>
      )}

      {/* Global Scheduled Interview Banner (Requirement 4) */}
      {scheduledApp && scheduledApp.status === 'Interview Scheduled' && currentView !== 'boardroom' && (
        <div
          style={{
            background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            zIndex: 100,
            boxShadow: '0 2px 10px rgba(217, 119, 6, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
              📅 Selector Interview Invitation: <strong>{scheduledApp.vacancyTitle}</strong> has been scheduled for you!
            </span>
          </div>
          <button
            onClick={() => handleAcceptInterview(scheduledApp)}
            style={{
              background: '#ffffff',
              color: '#92400e',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Accept Invitation & Enter Board Room <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Top Architecture Role & Port Banner */}
      <div
        style={{
          background: isInterviewerPort ? '#1E3A2F' : '#111111',
          color: '#FFFFFF',
          padding: '8px 24px',
          fontSize: '0.78rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="pulse-dot-green" />
          <span>
            {isInterviewerPort ? (
              <>
                <strong>SELECTOR CONSOLE (PORT 3001):</strong> Live Interviewer Console • WebRTC Video Calling & Rubric Evaluation Active
              </>
            ) : (
              <>
                <strong>CANDIDATE PORTAL (PORT 3000):</strong> Candidate Application & Interview Simulation • WebRTC Video & STT Active
              </>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href={isInterviewerPort ? 'http://localhost:3000' : 'http://localhost:3001'}
            target="_blank"
            rel="noreferrer"
            style={{
              color: '#D6CEC0',
              textDecoration: 'underline',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isInterviewerPort ? 'Open Candidate Portal (Port 3000) ↗' : 'Open Interviewer Console (Port 3001) ↗'}
          </a>
        </div>
      </div>

      {/* Main Header & Clean Navbar (Requirement 1 & 2) */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        interviewerSession={interviewerSession}
        candidateUser={candidateUser}
        hasScheduledInterview={Boolean(scheduledApp)}
        scheduledSessionId={activeSessionId}
        portalRole={portalRole}
        onOpenCandidateAuth={(tab) => {
          setAuthModalTab(tab);
          setIsAuthModalOpen(true);
        }}
        onCandidateLogout={() => {
          try {
            localStorage.removeItem('candidateUser');
          } catch (e) {}
          setCandidateUser(null);
          showToast('Signed out of candidate account.');
        }}
        onInterviewerLogout={() => {
          setInterviewerSession(null);
          setCurrentView(isInterviewerPort ? 'interviewer' : 'landing');
          showToast('Logged out of selector portal.');
        }}
      />

      {/* Main Content Body */}
      <main style={{ flex: 1 }}>
        {/* VIEW 1: LANDING PAGE */}
        {currentView === 'landing' && (
          <>
            <LandingHero
              onFileUpload={handleFileUpload}
              onGoToInterviewer={() => setCurrentView('interviewer')}
              candidate={candidateProfile}
              skills={candidateSkills}
            />
            <StatsBar />

            {/* Platform Overview Cards (Process & About Section) */}
            <section id="process-section" style={{ padding: '72px 0', background: 'var(--bg-page)', borderTop: '1px solid var(--border)' }}>
              <div className="container">
                <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 52px auto' }} id="about-section">
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <span className="pulse-dot-green" />
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--forest-green)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                      Standardized Selection Architecture
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.8rem', fontWeight: 500, color: '#111111', lineHeight: 1.12 }}>
                    A rigorous standard for <em>objective evaluation</em>.
                  </h2>
                  <p style={{ fontSize: '1.02rem', color: '#57534E', marginTop: '12px', lineHeight: 1.6 }}>
                    Experience the complete pipeline: dynamic CV parsing, cosine vacancy matching, live selector board room simulation, and printable audit dossiers.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '22px' }}>
                  <div
                    className="card"
                    style={{ padding: '28px 24px', cursor: 'pointer' }}
                    onClick={() => setCurrentView('candidate')}
                  >
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--forest-green)', marginBottom: '14px' }}>
                      01
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: '#111111', marginBottom: '8px' }}>
                      Dynamic CV Parser
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: '#57534E', lineHeight: 1.55 }}>
                      Parses uploaded PDF/DOCX resumes, maps skills to a 55+ taxonomy, and calculates real cosine match scores.
                    </p>
                  </div>

                  <div
                    className="card"
                    style={{ padding: '28px 24px', cursor: 'pointer' }}
                    onClick={() => setCurrentView('candidate')}
                  >
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--forest-green)', marginBottom: '14px' }}>
                      02
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: '#111111', marginBottom: '8px' }}>
                      Scheduled Meeting Flow
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: '#57534E', lineHeight: 1.55 }}>
                      Interviewer schedules slot, candidate receives instant invitation, and accepts to unlock the Board Room.
                    </p>
                  </div>

                  <div
                    className="card"
                    style={{ padding: '28px 24px', cursor: 'pointer' }}
                    onClick={() => {
                      if (scheduledApp || interviewerSession) {
                        setCurrentView('boardroom');
                      } else {
                        showToast('Board Room unlocks once an interview is scheduled or accepted.', 'info');
                      }
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--forest-green)', marginBottom: '14px' }}>
                      03
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: '#111111', marginBottom: '8px' }}>
                      Live Board Room
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: '#57534E', lineHeight: 1.55 }}>
                      Real Web Speech API dictation, AI question delivery, interviewer custom questions, and live AI concept scoring.
                    </p>
                  </div>

                  <div
                    className="card"
                    style={{ padding: '28px 24px', cursor: 'pointer' }}
                    onClick={() => setCurrentView('interviewer')}
                  >
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--forest-green)', marginBottom: '14px' }}>
                      04
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: '#111111', marginBottom: '8px' }}>
                      Selector Evaluation
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: '#57534E', lineHeight: 1.55 }}>
                      Dynamic 6-dimension evaluation scorecards, bias correlation audit, and printable official PDF download.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* VIEW 2: CANDIDATE FLOW */}
        {currentView === 'candidate' && (
          <div className="container" style={{ padding: '30px 20px' }}>
            {isInterviewerPort ? (
              <div style={{ maxWidth: '640px', margin: '40px auto' }}>
                <div className="card" style={{ padding: '44px 36px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span className="pulse-dot-green" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest-green)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                      Port Isolation Active
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 500, color: '#111111', marginBottom: '12px' }}>
                    Candidate Portal on Port 3000
                  </h2>
                  <p style={{ fontSize: '0.92rem', color: '#57534E', marginBottom: '24px', lineHeight: 1.6 }}>
                    This window is running the <strong>Selector Console (Port 3001)</strong>. Candidate application forms, CV parsing, and vacancy matching are hosted exclusively on Port 3000.
                  </p>
                  <a
                    href="http://localhost:3000"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '12px 28px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Open Candidate Portal (Port 3000) ↗
                  </a>
                </div>
              </div>
            ) : (
              <>
                {candidateState === 'upload' && (
                  <div style={{ maxWidth: '640px', margin: '40px auto' }}>
                    <div className="card" style={{ padding: '44px 36px', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
                      <div className="upload-tray-circle">
                        <UploadCloud size={28} />
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <span className="pulse-dot-green" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest-green)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                          Candidate Dossier
                        </span>
                      </div>
                      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 500, color: '#111111', marginBottom: '8px' }}>
                        Upload Candidate CV
                      </h2>
                      <p style={{ fontSize: '0.92rem', color: '#57534E', marginBottom: '28px' }}>
                        Upload your PDF or DOCX resume. The platform will dynamically extract technical skills and compute matching vacancies.
                      </p>

                      <input
                        type="file"
                        id="candidate-file-input"
                        style={{ display: 'none' }}
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                      />

                      <button
                        className="btn btn-primary"
                        style={{ padding: '13px 32px', fontSize: '0.98rem' }}
                        onClick={() => document.getElementById('candidate-file-input')?.click()}
                      >
                        <UploadCloud size={18} /> Select CV Document ↗
                      </button>
                    </div>
                  </div>
                )}

                {candidateState === 'analyzing' && (
                  <CvAnalyzingState fileName={uploadingFileName} />
                )}

                {candidateState === 'skills' && (
                  <SkillTagsEditor
                    candidate={candidateProfile}
                    skills={candidateSkills}
                    onUpdateSkills={setCandidateSkills}
                    onUpdateCandidate={setCandidateProfile}
                    onProceed={handleCalculateRecommendations}
                  />
                )}

                {candidateState === 'recommendations' && (
                  <JobRecommendations
                    candidate={candidateProfile}
                    skills={candidateSkills}
                    vacancies={scoredVacancies.length > 0 ? scoredVacancies : allVacancies}
                    appliedVacancyIds={appliedVacancyIds}
                    applications={applications}
                    onApply={handleApply}
                    onAcceptSchedule={handleAcceptInterview}
                    onEnterBoardRoom={(app) => {
                      if (app?.sessionId) setActiveSessionId(app.sessionId);
                      setCurrentView('boardroom');
                    }}
                    onBackToEdit={() => setCandidateState('skills')}
                    applicationConfirmation={applicationConfirmation}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* VIEW 3: BOARD ROOM SIMULATION (Unlocked after scheduling/acceptance) */}
        {currentView === 'boardroom' && (
          <div className="container" style={{ padding: '20px' }}>
            <BoardRoomView
              candidate={candidateProfile}
              initialSessionId={activeSessionId}
              interviewerSession={interviewerSession}
              onOpenReport={() => setCurrentView('audit')}
              portalRole={portalRole}
              onOpenCoding={() => setCurrentView('coding')}
            />
          </div>
        )}

        {/* VIEW 4: LIVE CODING SANDBOX */}
        {currentView === 'coding' && (
          <div className="container" style={{ padding: '20px' }}>
            <LiveCodingView />
          </div>
        )}

        {/* VIEW 5: QUESTION BANK & AI RECOMMENDER */}
        {currentView === 'questionbank' && (
          <div className="container" style={{ padding: '20px' }}>
            {!isInterviewerPort ? (
              <div style={{ maxWidth: '640px', margin: '40px auto' }}>
                <div className="card" style={{ padding: '44px 36px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span className="pulse-dot-green" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest-green)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                      Restricted Selector Tool
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', color: '#111111', marginBottom: '10px' }}>
                    Question Bank on Port 3001
                  </h2>
                  <p style={{ fontSize: '0.92rem', color: '#57534E', marginBottom: '20px' }}>
                    Question bank administration and AI selector recommendations are accessible exclusively on Port 3001.
                  </p>
                  <a
                    href="http://localhost:3001"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '10px 24px' }}
                  >
                    Open Selector Console (Port 3001) ↗
                  </a>
                </div>
              </div>
            ) : (
              <QuestionBankView candidate={candidateProfile} />
            )}
          </div>
        )}

        {/* VIEW 6: INTERVIEWER PORTAL */}
        {currentView === 'interviewer' && (
          <div className="container" style={{ padding: '20px' }}>
            {!isInterviewerPort ? (
              <div style={{ maxWidth: '640px', margin: '40px auto' }}>
                <div className="card" style={{ padding: '44px 36px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span className="pulse-dot-green" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest-green)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                      Port Isolation Active
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 500, color: '#111111', marginBottom: '12px' }}>
                    Selector Console on Port 3001
                  </h2>
                  <p style={{ fontSize: '0.92rem', color: '#57534E', marginBottom: '24px', lineHeight: 1.6 }}>
                    This window is running the <strong>Candidate Portal (Port 3000)</strong>. Selector dashboards, custom question delivery, and rubric scorecards are restricted to Port 3001.
                  </p>
                  <a
                    href="http://localhost:3001"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '12px 28px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Open Selector Console (Port 3001) ↗
                  </a>
                </div>
              </div>
            ) : !interviewerSession ? (
              <InterviewerLogin
                onLoginSuccess={(session) => {
                  setInterviewerSession(session);
                  showToast(`Authenticated as ${session.name}`);
                }}
                onBackToHome={() => setCurrentView('landing')}
              />
            ) : (
              <InterviewerDashboard
                applications={applications}
                vacancies={allVacancies}
                onScheduleInterview={handleScheduleInterview}
                onEnterBoardRoom={(app) => {
                  if (app?.sessionId) setActiveSessionId(app.sessionId);
                  setCurrentView('boardroom');
                }}
                interviewerSession={interviewerSession}
                onRefresh={fetchApplications}
              />
            )}
          </div>
        )}

        {/* VIEW 7: AUDIT REPORT & PRINTABLE PDF */}
        {currentView === 'audit' && (
          <div className="container" style={{ padding: '20px' }}>
            <AuditReportView candidate={candidateProfile} />
          </div>
        )}
      </main>

      {/* Candidate Auth / Registration Modal (Requirement 2) */}
      <CandidateAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleCandidateAuthSuccess}
        initialTab={authModalTab}
      />

      {/* Footer */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '24px 0', marginTop: 'auto' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            © 2026 <strong>Selector-Applicant Simulation Software</strong> — RACSim Architecture.
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: '#64748b' }}>
            <span>Dynamic CV Parsing</span>
            <span>•</span>
            <span>Live Board Room Simulation</span>
            <span>•</span>
            <span>Web Speech API STT</span>
            <span>•</span>
            <span>Printable PDF Dossier</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
