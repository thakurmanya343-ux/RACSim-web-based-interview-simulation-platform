import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';

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
    <div style={{ maxWidth: '480px', margin: '60px auto' }}>
      <div className="card" style={{ border: '1.5px solid #bfdbfe', padding: '36px 32px' }}>
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #008bdc 0%, #1e40af 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(0, 139, 220, 0.25)'
            }}
          >
            <Shield size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
            Interviewer / Selector Login
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '6px' }}>
            Access applicant dossiers, review AI semantic match scores, and schedule candidate simulation interviews.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Selector Email
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Mail size={16} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  fontSize: '0.92rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Password / Authorization Token
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Lock size={16} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  fontSize: '0.92rem'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '1rem', marginBottom: '18px' }}
          >
            Access Selector Dashboard <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Login Option */}
        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>
            Instant Demo Access
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('Dr. Vivek Kapoor', 'dr.kapoor@tsec.edu', 'Chief Selector - AI & Algorithms')}
              style={{ justifyContent: 'flex-start', padding: '8px 14px' }}
            >
              <UserCheck size={16} color="#008bdc" />
              <span>Login as <strong>Dr. Vivek Kapoor</strong> (Chief Selector)</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('Prof. Ananya Sen', 'prof.sen@tsec.edu', 'Panel Member - Web Systems')}
              style={{ justifyContent: 'flex-start', padding: '8px 14px' }}
            >
              <UserCheck size={16} color="#008bdc" />
              <span>Login as <strong>Prof. Ananya Sen</strong> (Web Systems Expert)</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onBackToHome}
            style={{ fontSize: '0.85rem', color: '#64748b', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            ← Back to Candidate Landing Page
          </button>
        </div>
      </div>
    </div>
  );
}
