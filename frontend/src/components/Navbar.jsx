import React from 'react';
import { Star, Shield, LogOut, Code2, BookOpen, BarChart3, Mic, User, Calendar, ArrowUpRight, Radio, ExternalLink } from 'lucide-react';

export default function Navbar({
  currentView,
  setCurrentView,
  interviewerSession,
  candidateUser,
  hasScheduledInterview,
  scheduledSessionId,
  onOpenCandidateAuth,
  onCandidateLogout,
  onInterviewerLogout,
  portalRole = 'candidate' // 'candidate' | 'interviewer'
}) {
  const isInterviewer = portalRole === 'interviewer';

  return (
    <header className="app-header">
      <div className="container header-inner">
        {/* Brand Logo - The Recruitment Simulation Journal */}
        <div
          className="logo-area"
          onClick={() => setCurrentView(isInterviewer ? 'interviewer' : 'landing')}
          title="Selector·Applicant"
        >
          <div className="logo-star-badge">
            <Star size={18} fill="#FFFFFF" color="#FFFFFF" />
          </div>
          <div>
            <div className="logo-text-title">
              Selector<span>·</span>Applicant
            </div>
            <div className="logo-subtitle">
              {isInterviewer ? 'Selector Board Console • Port 3001' : 'Candidate Portal • Port 3000'}
            </div>
          </div>
        </div>

        {/* Center Navigation Links - STRICT ROLE SEPARATION */}
        <nav className="nav-links">
          {/* ============================================================== */}
          {/* INTERVIEWER PORTAL NAVIGATION (PORT 3001)                      */}
          {/* ============================================================== */}
          {isInterviewer ? (
            <>
              <button
                className={`nav-link ${currentView === 'interviewer' ? 'active' : ''}`}
                onClick={() => setCurrentView('interviewer')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Shield size={14} /> Selector Board
              </button>

              <button
                className={`nav-link ${currentView === 'boardroom' ? 'active' : ''}`}
                onClick={() => setCurrentView('boardroom')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Mic size={14} /> Live Board Room
                <span
                  style={{
                    fontSize: '0.65rem',
                    background: 'var(--forest-green)',
                    color: '#ffffff',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    fontWeight: 700
                  }}
                >
                  WebRTC
                </span>
              </button>

              <button
                className={`nav-link ${currentView === 'questionbank' ? 'active' : ''}`}
                onClick={() => setCurrentView('questionbank')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <BookOpen size={14} /> Question Bank
              </button>

              <button
                className={`nav-link ${currentView === 'audit' ? 'active' : ''}`}
                onClick={() => setCurrentView('audit')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <BarChart3 size={14} /> Audit & PDF
              </button>
            </>
          ) : (
            /* ============================================================== */
            /* CANDIDATE PORTAL NAVIGATION (PORT 3000)                        */
            /* ============================================================== */
            <>
              <button
                className={`nav-link ${currentView === 'landing' ? 'active' : ''}`}
                onClick={() => setCurrentView('landing')}
              >
                Home
              </button>

              <button
                className={`nav-link ${currentView === 'candidate' ? 'active' : ''}`}
                onClick={() => setCurrentView('candidate')}
              >
                Candidate Dossier
              </button>

              <button
                className={`nav-link ${currentView === 'process' ? 'active' : ''}`}
                onClick={() => {
                  if (currentView !== 'landing') setCurrentView('landing');
                  setTimeout(() => {
                    const el = document.getElementById('process-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                Process
              </button>

              <button
                className={`nav-link ${currentView === 'about' ? 'active' : ''}`}
                onClick={() => {
                  if (currentView !== 'landing') setCurrentView('landing');
                  setTimeout(() => {
                    const el = document.getElementById('about-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                About
              </button>

              <button
                className={`nav-link ${currentView === 'boardroom' ? 'active' : ''}`}
                onClick={() => setCurrentView('boardroom')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: hasScheduledInterview ? 700 : 500,
                  color: hasScheduledInterview ? 'var(--forest-green)' : undefined
                }}
              >
                <Mic size={14} /> Board Room
                <span
                  style={{
                    fontSize: '0.65rem',
                    background: 'var(--forest-green)',
                    color: '#ffffff',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    fontWeight: 700
                  }}
                >
                  Live
                </span>
              </button>

              <button
                className={`nav-link ${currentView === 'coding' ? 'active' : ''}`}
                onClick={() => setCurrentView('coding')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Code2 size={14} /> Coding Sandbox
              </button>
            </>
          )}
        </nav>

        {/* Right Action CTAs */}
        <div className="nav-actions">
          {/* ============================================================== */}
          {/* INTERVIEWER ACTIONS                                            */}
          {/* ============================================================== */}
          {isInterviewer ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                <Shield size={15} color="var(--forest-green)" />
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#111111' }}>
                  {interviewerSession?.name || 'Dr. Vivek Kapoor (Chief Selector)'}
                </span>
                <span style={{ fontSize: '0.68rem', background: 'var(--forest-green-bg)', color: 'var(--forest-green)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  Port 3001
                </span>
              </div>

              {/* Portal Switcher Link */}
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                title="Open Candidate Portal on Port 3000 in new tab"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.78rem',
                  color: '#57534E',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border)',
                  background: '#FFFFFF',
                  fontWeight: 600
                }}
              >
                Candidate Port 3000 <ExternalLink size={12} />
              </a>
            </div>
          ) : candidateUser ? (
            /* ============================================================== */
            /* CANDIDATE LOGGED IN                                            */
            /* ============================================================== */
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {hasScheduledInterview && (
                <button
                  className="btn btn-forest btn-sm"
                  onClick={() => setCurrentView('boardroom')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Calendar size={14} /> Enter Board Room
                </button>
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                <User size={15} color="var(--forest-green)" />
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#111111' }}>
                  {candidateUser.name}
                </span>
                <span style={{ fontSize: '0.68rem', background: 'var(--forest-green-bg)', color: 'var(--forest-green)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  Port 3000
                </span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onCandidateLogout}
                title="Sign out candidate"
              >
                <LogOut size={13} />
              </button>

              {/* Portal Switcher Link */}
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noreferrer"
                title="Open Interviewer Console on Port 3001 in new tab"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.78rem',
                  color: '#57534E',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border)',
                  background: '#FFFFFF',
                  fontWeight: 600
                }}
              >
                Selector Port 3001 <ExternalLink size={12} />
              </a>
            </div>
          ) : (
            /* ============================================================== */
            /* CANDIDATE NOT LOGGED IN                                        */
            /* ============================================================== */
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="nav-login-link"
                onClick={() => onOpenCandidateAuth('signin')}
              >
                Log in
              </button>

              <button
                className="nav-signup-btn"
                onClick={() => onOpenCandidateAuth('signup')}
              >
                Sign up <ArrowUpRight size={14} />
              </button>

              {/* Portal Switcher Link */}
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noreferrer"
                title="Open Interviewer Console on Port 3001 in new tab"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.78rem',
                  color: '#57534E',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border)',
                  background: '#FFFFFF',
                  fontWeight: 600
                }}
              >
                Selector Port 3001 <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
