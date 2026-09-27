import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowUpRight, UserCheck, ArrowLeft, Star } from 'lucide-react';

export default function InterviewerLogin({ onLoginSuccess, onBackToHome }) {
  const [email, setEmail] = useState('dr.kapoor@selector-board.org');
  const [password, setPassword] = useState('selector2026');
  const [panelistRole, setPanelistRole] = useState('Chief Selector - AI & Engineering Boards');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLoginSuccess({
      email,
      name: email.includes('sen') ? 'Prof. Ananya Sen' : 'Dr. Vivek Kapoor',
      role: panelistRole
    });
  };

  const handleQuickLogin = (name, mail, role) => {
    onLoginSuccess({
      name,
      email: mail,
      role
    });
  };

  return (
    <div style={{ maxWidth: '520px', margin: '60px auto', padding: '0 20px' }}>
      <div className="card" style={{ padding: '40px 36px', boxShadow: 'var(--shadow-lg)' }}>
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#111111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#FFFFFF'
            }}
          >
            <Shield size={26} />
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span className="pulse-dot-green" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest-green)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              Selector Portal
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.1rem', fontWeight: 500, color: '#111111', lineHeight: 1.15 }}>
            Board of Selectors
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#57534E', marginTop: '6px' }}>
            Review candidate dossiers, evaluate speech responses, deliver live questions, and generate official audit PDFs.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
              Selector Email
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }}>
                <Mail size={16} />
              </div>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
              Authorization Passcode
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }}>
                <Lock size={16} />
              </div>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: '0.96rem', marginBottom: '22px' }}
          >
            Access Selector Dashboard <ArrowUpRight size={16} />
          </button>
        </form>

        {/* Quick Demo Login Option */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Instant Evaluation Credentials
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('Dr. Vivek Kapoor', 'dr.kapoor@tsec.edu', 'Chief Selector - AI & Algorithms')}
              style={{ justifyContent: 'flex-start', padding: '10px 16px', borderRadius: 'var(--radius-md)' }}
            >
              <UserCheck size={16} color="var(--forest-green)" />
              <span>Login as <strong>Dr. Vivek Kapoor</strong> (Chief Selector)</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('Prof. Ananya Sen', 'prof.sen@tsec.edu', 'Panel Member - Web Systems')}
              style={{ justifyContent: 'flex-start', padding: '10px 16px', borderRadius: 'var(--radius-md)' }}
            >
              <UserCheck size={16} color="var(--forest-green)" />
              <span>Login as <strong>Prof. Ananya Sen</strong> (Web Systems Expert)</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onBackToHome}
            style={{ fontSize: '0.86rem', color: '#57534E', cursor: 'pointer', background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Back to Candidate Landing Page
          </button>
        </div>
      </div>
    </div>
  );
}
