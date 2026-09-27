import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles, FileText, Cpu, CheckCircle } from 'lucide-react';

export default function CvAnalyzingState({ fileName }) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(2), 700);
    const t2 = setTimeout(() => setStep(3), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      style={{
        maxWidth: '560px',
        margin: '60px auto',
        background: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #bfdbfe',
        boxShadow: '0 20px 45px rgba(0, 139, 220, 0.12)',
        padding: '40px 32px',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e0f2fe 0%, #bfdbfe 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          color: '#008bdc'
        }}
      >
        <Loader2 size={36} className="spin-animation" style={{ animation: 'spin 1.2s linear infinite' }} />
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
        Analyzing your CV...
      </h2>
      <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '28px' }}>
        File: <strong style={{ color: '#008bdc' }}>{fileName || 'Resume Document'}</strong>
      </p>

      {/* Progress steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left', maxWidth: '420px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {step >= 1 ? (
            <CheckCircle size={18} color="#10b981" />
          ) : (
            <FileText size={18} color="#94a3b8" />
          )}
          <span style={{ fontSize: '0.88rem', color: step >= 1 ? '#0f172a' : '#94a3b8', fontWeight: 500 }}>
            Extracting text via pdfplumber / python-docx
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {step >= 2 ? (
            <CheckCircle size={18} color="#10b981" />
          ) : (
            <Cpu size={18} color="#94a3b8" />
          )}
          <span style={{ fontSize: '0.88rem', color: step >= 2 ? '#0f172a' : '#94a3b8', fontWeight: 500 }}>
            Cross-referencing with 50+ domain skills taxonomy
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {step >= 3 ? (
            <CheckCircle size={18} color="#10b981" />
          ) : (
            <Sparkles size={18} color="#94a3b8" />
          )}
          <span style={{ fontSize: '0.88rem', color: step >= 3 ? '#0f172a' : '#94a3b8', fontWeight: 500 }}>
            Synthesizing candidate profile & match vectors
          </span>
        </div>
      </div>
    </div>
  );
}
