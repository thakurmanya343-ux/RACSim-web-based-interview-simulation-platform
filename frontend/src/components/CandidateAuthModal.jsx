import React, { useState } from 'react';
import { X, Mail, Lock, User, Briefcase, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, Check } from 'lucide-react';

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
      avatarBg: '#008bdc',
      initials: 'NS'
    },
    {
      name: 'Candidate Applicant',
      email: 'candidate.racsim@gmail.com',
      avatarBg: '#7c3aed',
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
          photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=008bdc&color=fff`
        };
        onAuthSuccess(googleUser);
        setShowGoogleChooser(false);
        onClose();
      }, 700);
    }, 1200);
  };

  // Submit Custom Google Account
  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customGoogleEmail.trim() || !customGoogleEmail.includes('@')) {
      setError('Please provide a valid Google email.');
      return;
    }
    const name = customGoogleName.trim() || customGoogleEmail.split('@')[0].replace(/[\._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    handleSelectGoogleAccount({
      name,
      email: customGoogleEmail.trim(),
      avatarBg: '#10b981',
      initials: name.slice(0, 2).toUpperCase()
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
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
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
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: showGoogleChooser ? '440px' : '460px',
          boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          animation: 'fadeIn 0.2s ease-out',
          transition: 'all 0.25s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* VIEW 1: AUTHENTIC GOOGLE OAUTH POPUP SCREEN */}
        {showGoogleChooser ? (
          <div style={{ padding: '28px 24px', position: 'relative' }}>
            {/* Google Brand Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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
              <p style={{ fontSize: '0.9rem', color: '#5f6368', margin: 0 }}>
                Choose an account to continue to <strong>Selector-Applicant Platform</strong>
              </p>
            </div>

            {googleStep === 'verifying' ? (
              /* Google Verifying State */
              <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                <div style={{ width: '48px', height: '48px', margin: '0 auto 16px auto', border: '3px solid #e0f2fe', borderTop: '3px solid #008bdc', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '1rem' }}>
                  Connecting to Google Accounts...
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px' }}>
                  Authenticating OAuth 2.0 Credentials
                </div>
              </div>
            ) : googleStep === 'success' ? (
              /* Google Success State */
              <div style={{ textAlign: 'center', padding: '36px 10px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
                  <Check size={28} />
                </div>
                <div style={{ fontWeight: 800, color: '#065f46', fontSize: '1.1rem' }}>
                  Google Verification Succeeded!
                </div>
                <div style={{ fontSize: '0.84rem', color: '#047857', marginTop: '4px' }}>
                  Setting up candidate profile...
                </div>
              </div>
            ) : (
              /* Google Account Chooser List */
              <div>
                <div style={{ border: '1px solid #dadce0', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
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
                        borderBottom: index < googleAccounts.length - 1 || showCustomGoogleInput ? '1px solid #dadce0' : 'none',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafd'}
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
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#202124', lineHeight: 1.3 }}>
                          {acc.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#5f6368', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
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
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafd'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          border: '1.5px dashed #9aa0a6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#5f6368',
                          fontSize: '1.2rem',
                          fontWeight: 600
                        }}
                      >
                        +
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#1a73e8', fontWeight: 600 }}>
                        Use another Google account
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCustomGoogleSubmit} style={{ padding: '16px 18px', background: '#f8fafd' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#202124', marginBottom: '8px' }}>
                        Enter Your Google Credentials:
                      </div>
                      <input
                        type="text"
                        placeholder="Google Account Name (e.g. Namokar Savale)"
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #dadce0',
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
                          borderRadius: '6px',
                          border: '1px solid #dadce0',
                          fontSize: '0.88rem',
                          marginBottom: '10px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', padding: '9px', background: '#1a73e8' }}
                      >
                        Continue with this Google Account
                      </button>
                    </form>
                  )}
                </div>

                {/* Google Privacy & Consent Text */}
                <div style={{ fontSize: '0.75rem', color: '#5f6368', lineHeight: 1.4, marginBottom: '20px' }}>
                  To continue, Google will securely share your name, email address, and profile credentials with Selector-Applicant Simulation Software.
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setShowGoogleChooser(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#1a73e8',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ArrowLeft size={14} /> Back to email login
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowGoogleChooser(false);
                      onClose();
                    }}
                    style={{
                      background: '#f1f3f4',
                      border: 'none',
                      padding: '7px 16px',
                      borderRadius: '4px',
                      color: '#3c4043',
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
          /* VIEW 2: STANDARD REGISTRATION & LOGIN WITH GOOGLE CTA */
          <div>
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #008bdc 0%, #0066a1 100%)',
                padding: '24px 28px',
                color: '#ffffff',
                position: 'relative'
              }}
            >
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e0f2fe', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Candidate Portal
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
                {tab === 'signup' ? 'Create Candidate Account' : 'Welcome Back'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#bfdbfe', marginTop: '6px', marginBottom: 0 }}>
                {tab === 'signup'
                  ? 'Sign up to upload your CV, track applications, and join Board Room simulations.'
                  : 'Sign in to access your matched vacancies and scheduled interviews.'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => { setTab('signup'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '0.9rem',
                  fontWeight: tab === 'signup' ? 700 : 500,
                  color: tab === 'signup' ? '#008bdc' : '#64748b',
                  border: 'none',
                  borderBottom: tab === 'signup' ? '2.5px solid #008bdc' : 'none',
                  background: tab === 'signup' ? '#f0f7fe' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Candidate Sign Up
              </button>
              <button
                type="button"
                onClick={() => { setTab('signin'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '0.9rem',
                  fontWeight: tab === 'signin' ? 700 : 500,
                  color: tab === 'signin' ? '#008bdc' : '#64748b',
                  border: 'none',
                  borderBottom: tab === 'signin' ? '2.5px solid #008bdc' : 'none',
                  background: tab === 'signin' ? '#f0f7fe' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
            </div>

            {/* Body Form */}
            <div style={{ padding: '24px 28px' }}>
              {error && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    marginBottom: '16px'
                  }}
                >
                  {error}
                </div>
              )}

              {/* Prominent Google Sign-In Button */}
              <button
                type="button"
                onClick={handleOpenGoogle}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '11px 16px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#1e293b',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                {/* Official Google SVG Icon */}
                <svg width="20" height="20" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
                </svg>
                <span>{tab === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '18px 0',
                  gap: '12px'
                }}
              >
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                  or with email
                </span>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {tab === 'signup' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Full Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} color="#94a3b8" style={{ position: 'absolute', top: '11px', left: '12px' }} />
                      <input
                        type="text"
                        placeholder="e.g. Namokar Savale"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 36px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.9rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#94a3b8" style={{ position: 'absolute', top: '11px', left: '12px' }} />
                    <input
                      type="email"
                      placeholder="candidate@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#94a3b8" style={{ position: 'absolute', top: '11px', left: '12px' }} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {tab === 'signup' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Target Technical Domain
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Briefcase size={16} color="#94a3b8" style={{ position: 'absolute', top: '11px', left: '12px' }} />
                      <select
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 36px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.9rem',
                          outline: 'none',
                          backgroundColor: '#fff'
                        }}
                      >
                        <option value="AI & Machine Learning">AI & Machine Learning (Scientist Track)</option>
                        <option value="Full-Stack Web Development">Full-Stack Web Development</option>
                        <option value="Systems & Embedded Programming">Systems & Embedded Programming</option>
                        <option value="Data Science & Analytics">Data Science & Analytics</option>
                        <option value="Cloud & DevOps Engineering">Cloud & DevOps Engineering</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '11px',
                    fontSize: '0.95rem',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? 'Processing...' : (
                    <>
                      <span>{tab === 'signup' ? 'Create Account & Continue' : 'Sign In to Portal'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
