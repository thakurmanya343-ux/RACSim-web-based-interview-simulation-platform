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
        background: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        border: '1.5px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
        padding: '44px 36px',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          color: 'var(--forest-green)'
        }}
      >
        <Loader2 size={32} style={{ animation: 'spin 1.2s linear infinite' }} />
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <span className="pulse-dot-green" />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest-green)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
          Semantic Extraction
        </span>
      </div>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.1rem', fontWeight: 500, color: '#111111', lineHeight: 1.15, marginBottom: '8px' }}>
        Analyzing your dossier...
      </h2>
      <p style={{ fontSize: '0.9rem', color: '#57534E', marginBottom: '32px' }}>
        Document: <strong style={{ color: '#111111' }}>{fileName || 'Resume Document'}</strong>
      </p>

      {/* Progress steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left', maxWidth: '420px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {step >= 1 ? (
            <CheckCircle size={18} color="var(--forest-green)" />
          ) : (
            <FileText size={18} color="#A8A29E" />
          )}
          <span style={{ fontSize: '0.88rem', color: step >= 1 ? '#111111' : '#A8A29E', fontWeight: 500 }}>
            Extracting text entities via structural parser
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {step >= 2 ? (
            <CheckCircle size={18} color="var(--forest-green)" />
          ) : (
            <Cpu size={18} color="#A8A29E" />
          )}
          <span style={{ fontSize: '0.88rem', color: step >= 2 ? '#111111' : '#A8A29E', fontWeight: 500 }}>
            Cross-referencing with 55+ technical competencies taxonomy
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {step >= 3 ? (
            <CheckCircle size={18} color="var(--forest-green)" />
          ) : (
            <Sparkles size={18} color="#A8A29E" />
          )}
          <span style={{ fontSize: '0.88rem', color: step >= 3 ? '#111111' : '#A8A29E', fontWeight: 500 }}>
            Synthesizing candidate profile & cosine match vectors
          </span>
        </div>
      </div>
    </div>
  );
}
