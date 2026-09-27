import React, { useState } from 'react';
import { X, Mail, Lock, User, Briefcase, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, Check, Sparkles } from 'lucide-react';

export default function CandidateAuthModal({ isOpen, onClose, onAuthSuccess, initialTab = 'signup' }) {
  const [tab, setTab] = useState(initialTab); // 'signup' | 'signin'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [domain, setDomain] = useState('AI & Machine Learning');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google OAuth Interactive State
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [googleStep, setGoogleStep] = useState('select'); // 'select' | 'verifying' | 'success'

  if (!isOpen) return null;

  // Standard Email/Password registration / login
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (tab === 'signup' && !fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user = {
        id: `cand-${Date.now().toString(36)}`,
        name: tab === 'signup' ? fullName.trim() : (email.split('@')[0].replace(/[\._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
        email: email.trim(),
        domain: domain,
        authProvider: 'email'
      };
      onAuthSuccess(user);
      onClose();
    }, 600);
  };

  // Google Accounts List
  const googleAccounts = [
    {
      name: 'Namokar Savale',
      email: 'namokar.savale@gmail.com',
      avatarBg: '#111111',
      initials: 'NS'
    },
    {
      name: 'Candidate Applicant',
      email: 'candidate.racsim@gmail.com',
      avatarBg: '#1E3A2F',
      initials: 'CA'
    }
  ];

  // Initiate Google Sign In (Opens Google Account Chooser)
  const handleOpenGoogle = () => {
    setShowGoogleChooser(true);
    setGoogleStep('select');
    setError('');
  };

  // Select a Google Account
  const handleSelectGoogleAccount = (acc) => {
    setGoogleStep('verifying');
    setTimeout(() => {
      setGoogleStep('success');
      setTimeout(() => {
        const googleUser = {
          id: `cand-g-${Date.now().toString(36)}`,
          name: acc.name,
          email: acc.email,
          domain: domain,
          authProvider: 'google',
          isGoogleVerified: true,
          photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=111111&color=fff`
        };
        onAuthSuccess(googleUser);
        setShowGoogleChooser(false);
        onClose();
      }, 700);
    }, 1100);
  };

  // Submit Custom Google Account
  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customGoogleEmail.trim() || !customGoogleEmail.includes('@')) {
      setError('Please enter a valid Google email address.');
      return;
    }
    const computedName = customGoogleName.trim() || customGoogleEmail.split('@')[0].replace(/[\._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    handleSelectGoogleAccount({
      name: computedName,
      email: customGoogleEmail.trim(),
      avatarBg: '#111111',
      initials: computedName.slice(0, 2).toUpperCase()
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(17, 17, 17, 0.6)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={() => {
        setShowGoogleChooser(false);
        onClose();
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: showGoogleChooser ? '440px' : '480px',
          boxShadow: '0 25px 50px -12px rgba(17, 17, 17, 0.25)',
          overflow: 'hidden',
          border: '1.5px solid #E8E2D6',
          animation: 'modalEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          transition: 'all 0.25s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* VIEW 1: AUTHENTIC GOOGLE OAUTH POPUP SCREEN */}
        {showGoogleChooser ? (
          <div style={{ padding: '32px 28px', position: 'relative' }}>
            {/* Google Brand Header */}
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <svg width="28" height="28" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
                </svg>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#202124', margin: '0 0 6px 0', fontFamily: 'Roboto, Google Sans, sans-serif' }}>
                Sign in with Google
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#5f6368', margin: 0 }}>
                Choose an account to continue to <strong>Selector·Applicant Journal</strong>
              </p>
            </div>

            {googleStep === 'verifying' ? (
              /* Google Verifying State */
              <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                <div style={{ width: '44px', height: '44px', margin: '0 auto 16px auto', border: '3px solid #E8E2D6', borderTop: '3px solid #111111', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <div style={{ fontWeight: 600, color: '#111111', fontSize: '0.98rem' }}>
                  Connecting to Google Accounts...
                </div>
                <div style={{ fontSize: '0.82rem', color: '#78716C', marginTop: '6px' }}>
                  Authenticating OAuth 2.0 Credentials
                </div>
              </div>
            ) : googleStep === 'success' ? (
              /* Google Success State */
              <div style={{ textAlign: 'center', padding: '36px 10px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--forest-green-bg)', color: 'var(--forest-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
                  <Check size={26} />
                </div>
                <div style={{ fontWeight: 700, color: 'var(--forest-green)', fontSize: '1.08rem' }}>
                  Google Verification Succeeded!
                </div>
                <div style={{ fontSize: '0.84rem', color: '#78716C', marginTop: '4px' }}>
                  Setting up candidate profile...
                </div>
              </div>
            ) : (
              /* Google Account Chooser List */
              <div>
                <div style={{ border: '1px solid #E5E0D5', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                  {googleAccounts.map((acc, index) => (
                    <div
                      key={acc.email}
                      onClick={() => handleSelectGoogleAccount(acc)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 18px',
                        cursor: 'pointer',
                        borderBottom: index < googleAccounts.length - 1 || showCustomGoogleInput ? '1px solid #E5E0D5' : 'none',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: acc.avatarBg,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.88rem'
                        }}
                      >
                        {acc.initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#111111', lineHeight: 1.3 }}>
                          {acc.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#78716C', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {acc.email}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Option: Use Another Google Account */}
                  {!showCustomGoogleInput ? (
                    <div
                      onClick={() => setShowCustomGoogleInput(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 18px',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          border: '1.5px dashed #A8A29E',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#78716C'
                        }}
                      >
                        <User size={18} />
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#111111', fontWeight: 600 }}>
                        Use another Google account
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCustomGoogleSubmit} style={{ padding: '16px', background: 'var(--bg-card-warm)' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111111', marginBottom: '8px' }}>
                        Enter Your Google Credentials
                      </div>
                      <input
                        type="text"
                        placeholder="Full Name (e.g. Namokar Savale)"
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #E5E0D5',
                          fontSize: '0.88rem',
                          marginBottom: '8px',
                          outline: 'none'
                        }}
                      />
                      <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #E5E0D5',
                          fontSize: '0.88rem',
                          marginBottom: '10px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', padding: '9px' }}
                      >
                        Continue with this Google Account
                      </button>
                    </form>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setShowGoogleChooser(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--forest-green)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ArrowLeft size={14} /> Back to standard login
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowGoogleChooser(false);
                      onClose();
                    }}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: 'none',
                      padding: '7px 16px',
                      borderRadius: 'var(--radius-full)',
                      color: '#111111',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* VIEW 2: EDITORIAL JOURNAL REGISTRATION & LOGIN */
          <div>
            {/* Header */}
            <div
              style={{
                background: 'var(--bg-page)',
                padding: '30px 32px 20px 32px',
                borderBottom: '1px solid var(--border)',
                position: 'relative'
              }}
            >
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '24px',
                  background: 'var(--bg-subtle)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#111111',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="pulse-dot-green" />
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--forest-green)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Candidate Journal
                </span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', fontWeight: 500, color: '#111111', margin: '0 0 6px 0', lineHeight: 1.15 }}>
                {tab === 'signup' ? (
                  <>Create candidate profile.</>
                ) : (
                  <>Welcome back. <em>Objective evaluation.</em></>
                )}
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#57534E', margin: 0 }}>
                {tab === 'signup'
                  ? 'Register to match skills against selector vacancies and access board room simulations.'
                  : 'Sign in to access your interview schedule, matched vacancies, and official reports.'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#FFFFFF' }}>
              <button
                type="button"
                onClick={() => { setTab('signup'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '0.9rem',
                  fontWeight: tab === 'signup' ? 700 : 500,
                  color: tab === 'signup' ? '#111111' : '#78716C',
                  border: 'none',
                  borderBottom: tab === 'signup' ? '2.5px solid #111111' : 'none',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => { setTab('signin'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '0.9rem',
                  fontWeight: tab === 'signin' ? 700 : 500,
                  color: tab === 'signin' ? '#111111' : '#78716C',
                  border: 'none',
                  borderBottom: tab === 'signin' ? '2.5px solid #111111' : 'none',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '28px 32px' }}>
              {/* PRIMARY ACTION: Sign up with Google */}
              <button
                type="button"
                onClick={handleOpenGoogle}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid var(--border)',
                  background: '#FFFFFF',
                  color: '#111111',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  marginBottom: '20px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  e.currentTarget.style.borderColor = '#111111';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
                </svg>
                <span>{tab === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
              </button>

              {/* Editorial Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  or with email
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    background: 'var(--danger-bg)',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: 'var(--danger)',
                    fontSize: '0.85rem',
                    marginBottom: '16px'
                  }}
                >
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {tab === 'signup' && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Namokar Savale"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                )}

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="candidate@racsim.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: tab === 'signup' ? '14px' : '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {tab === 'signup' && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
                      Target Technical Specialization
                    </label>
                    <select
                      className="form-input"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                    >
                      <option value="AI & Machine Learning">AI & Machine Learning</option>
                      <option value="Systems & Cloud Architecture">Systems & Cloud Architecture</option>
                      <option value="Full Stack Web Engineering">Full Stack Web Engineering</option>
                      <option value="Cybersecurity & Cryptography">Cybersecurity & Cryptography</option>
                      <option value="Techno-Managerial Leadership">Techno-Managerial Leadership</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : tab === 'signup' ? 'Complete Candidate Registration ↗' : 'Sign in to Journal ↗'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
