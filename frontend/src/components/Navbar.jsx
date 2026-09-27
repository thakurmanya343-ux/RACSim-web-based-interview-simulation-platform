import React from 'react';
import { Briefcase, UserCheck, Shield, LogOut, FileText, Code2, Users, BookOpen, BarChart3, Mic, User, Calendar, Sparkles } from 'lucide-react';

export default function Navbar({
  currentView,
  setCurrentView,
  interviewerSession,
  candidateUser,
  hasScheduledInterview,
  scheduledSessionId,
  onOpenCandidateAuth,
  onCandidateLogout,
  onInterviewerLogout
}) {
  // Simulation features (Board Room, Coding, Question Bank, Audit) only unlock
  // when an interview is scheduled/accepted, an interviewer is active, or user is already in a simulation view
  const simulationUnlocked = Boolean(
    interviewerSession ||
    hasScheduledInterview ||
    currentView === 'boardroom' ||
    currentView === 'coding' ||
    currentView === 'questionbank' ||
    currentView === 'audit'
  );

  return (
    <header className="app-header">
      <div className="container header-inner">
        {/* Brand Logo */}
        <div className="logo-area" onClick={() => setCurrentView('landing')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">
            <Briefcase size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="logo-text-title">Selector-Applicant</span>
              <span className="logo-tag">SIMULATION AI</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
              Recruitment & Board Room Simulation Platform
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="nav-links">
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
            Candidate Portal
          </button>

          {/* Conditional Simulation Tabs: ONLY shown after interview is scheduled or when in active session */}
          {simulationUnlocked && (
            <>
              <button
                className={`nav-link ${currentView === 'boardroom' ? 'active' : ''}`}
                onClick={() => setCurrentView('boardroom')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: hasScheduledInterview ? 700 : 500,
                  color: hasScheduledInterview ? '#008bdc' : undefined
                }}
              >
                <Mic size={14} /> Board Room
                {hasScheduledInterview && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      background: '#10b981',
                      color: '#ffffff',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      marginLeft: '3px'
                    }}
                  >
                    Live
                  </span>
                )}
              </button>

              <button
                className={`nav-link ${currentView === 'coding' ? 'active' : ''}`}
                onClick={() => setCurrentView('coding')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Code2 size={14} /> Coding Sandbox
              </button>

              {interviewerSession && (
                <button
                  className={`nav-link ${currentView === 'questionbank' ? 'active' : ''}`}
                  onClick={() => setCurrentView('questionbank')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <BookOpen size={14} /> Question Bank
                </button>
              )}

              <button
                className={`nav-link ${currentView === 'audit' ? 'active' : ''}`}
                onClick={() => setCurrentView('audit')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <BarChart3 size={14} /> Audit & PDF
              </button>
            </>
          )}

          {interviewerSession && (
            <button
              className={`nav-link ${currentView === 'interviewer' ? 'active' : ''}`}
              onClick={() => setCurrentView('interviewer')}
            >
              Interviewer Dashboard
            </button>
          )}
        </nav>

        {/* Action CTAs */}
        <div className="nav-actions">
          {interviewerSession ? (
            /* Interviewer Session Active */
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f0f7fe',
                  border: '1px solid #bfdbfe',
                  padding: '6px 12px',
                  borderRadius: '8px'
                }}
              >
                <Shield size={16} color="#008bdc" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  {interviewerSession.name}
                </span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onInterviewerLogout}
                title="Log out from selector portal"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : candidateUser ? (
            /* Candidate User Logged In */
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {hasScheduledInterview && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setCurrentView('boardroom')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10b981' }}
                >
                  <Calendar size={14} /> Enter Board Room
                </button>
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: candidateUser.authProvider === 'google' ? '#f8fafd' : '#f8fafc',
                  border: candidateUser.authProvider === 'google' ? '1.5px solid #bfdbfe' : '1px solid #cbd5e1',
                  padding: '5px 12px',
                  borderRadius: '8px'
                }}
              >
                {candidateUser.authProvider === 'google' ? (
                  <svg width="16" height="16" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
                  </svg>
                ) : (
                  <User size={15} color="#008bdc" />
                )}
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
                  {candidateUser.name}
                </span>
                {candidateUser.authProvider === 'google' && (
                  <span style={{ fontSize: '0.68rem', background: '#e0f2fe', color: '#0284c7', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    Google Verified
                  </span>
                )}
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onCandidateLogout}
                title="Sign out candidate"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            /* Public Landing Navbar: Only Candidate Login/Signup & Interviewer Login */
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenCandidateAuth('signin')}
              >
                Candidate Login
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => onOpenCandidateAuth('signup')}
              >
                Candidate Sign Up
              </button>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => setCurrentView('interviewer')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Shield size={14} color="#008bdc" />
                Interviewer Login
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
