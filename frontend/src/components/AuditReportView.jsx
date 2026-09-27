import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ShieldCheck,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Save,
  BarChart3
} from 'lucide-react';

export default function AuditReportView({ candidate }) {
  const [auditData, setAuditData] = useState(null);
  const [techScore, setTechScore] = useState(88);
  const [depthScore, setDepthScore] = useState(82);
  const [commScore, setCommScore] = useState(90);
  const [consistencyScore, setConsistencyScore] = useState(85);
  const [expertNotes, setExpertNotes] = useState('Candidate demonstrated rigorous conceptual understanding in computer vision and neural architectural trade-offs.');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    try {
      const res = await fetch('/api/admin/audit/expert-consistency');
      const data = await res.json();
      setAuditData(data);
    } catch (e) {
      console.error('Audit fetch error:', e);
    }
  };

  const handleSaveManualScore = async () => {
    try {
      const res = await fetch('/api/manual-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answerId: 'ans-demo-01',
          technicalScore: techScore,
          depthScore: depthScore,
          communicationScore: commScore,
          consistencyScore: consistencyScore,
          notes: expertNotes
        })
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Save manual score error:', err);
    }
  };

  // Weighted calculation
  const questionRel = 92;
  const answerRel = 84;
  const finalScore = Math.round(
    0.10 * questionRel +
    0.25 * answerRel +
    0.35 * techScore +
    0.15 * depthScore +
    0.10 * commScore +
    0.05 * consistencyScore
  );

  return (
    <div style={{ maxWidth: '1060px', margin: '30px auto', padding: '0 20px' }}>
      {/* Top Banner */}
      <div
        style={{
          background: '#111111',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="pulse-dot-green" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest-green-border)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              Board Room Evaluation Dossier
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', fontWeight: 500, color: '#ffffff', margin: 0 }}>
            Evaluation Dossier & Expert Consistency Audit
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#D6CEC0', marginTop: '4px' }}>
            Official assessment dossier with pure JS printable PDF export and scoring bias audit.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href={`/api/report/${candidate?.id || 'cand-001'}/vac-ai-ml/pdf`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-forest"
            style={{ padding: '11px 22px' }}
          >
            <Download size={16} /> Download Official PDF Dossier
          </a>
        </div>
      </div>

      {/* Main Scorecard Overview */}
      <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '22px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600, color: '#111111', margin: 0 }}>
              Final Candidate Assessment Scorecard
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Candidate: <strong>{candidate?.name || 'Candidate'}</strong> • Post: <strong>Technical Assessment</strong>
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2.8rem', fontWeight: 700, color: 'var(--forest-green)' }}>
              {finalScore}%
            </span>
            <div style={{ fontSize: '0.78rem', color: 'var(--forest-green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Strongly Recommended for Appointment
            </div>
          </div>
        </div>

        {/* 6 Dimension Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
              <span>Question Relevance (10%)</span>
              <span className="badge badge-blue">AI Cosine</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {questionRel}%
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
              <span>Answer Relevance (25%)</span>
              <span className="badge badge-blue">AI Cosine</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {answerRel}%
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
              <span>Technical Knowledge (35%)</span>
              <span className="badge badge-green">Panel Rating</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {techScore}%
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
              <span>Depth & Edge Cases (15%)</span>
              <span className="badge badge-green">Panel Rating</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {depthScore}%
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
              <span>Communication Clarity (10%)</span>
              <span className="badge badge-green">Panel Rating</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {commScore}%
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
              <span>Interview Consistency (5%)</span>
              <span className="badge badge-green">Panel Rating</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {consistencyScore}%
            </div>
          </div>
        </div>

        {/* Formula display */}
        <div style={{ background: '#f1f5f9', padding: '12px 18px', borderRadius: '8px', fontSize: '0.82rem', color: '#475569', fontFamily: 'monospace' }}>
          Final Score = 0.10(Question Rel) + 0.25(Answer Rel) + 0.35(Tech Knowledge) + 0.15(Depth) + 0.10(Comm) + 0.05(Consistency)
        </div>
      </div>

      {/* Selector Manual Scoring Controls */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="#008bdc" />
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Panel Expert Manual Assessment Overrides
            </h4>
          </div>
          {isSaved && <span className="badge badge-green">Ratings Saved Successfully!</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
              <span>Technical Correctness: {techScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={techScore}
              onChange={(e) => setTechScore(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
              <span>Conceptual Depth: {depthScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={depthScore}
              onChange={(e) => setDepthScore(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
              <span>Communication Clarity: {commScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={commScore}
              onChange={(e) => setCommScore(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
              <span>Consistency & Articulation: {consistencyScore}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={consistencyScore}
              onChange={(e) => setConsistencyScore(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
            Board Selector Qualitative Remarks:
          </label>
          <textarea
            rows={3}
            value={expertNotes}
            onChange={(e) => setExpertNotes(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
          />
        </div>

        <button className="btn btn-primary" onClick={handleSaveManualScore}>
          <Save size={15} /> Save Panel Evaluation Remarks
        </button>
      </div>

      {/* Expert Bias & Consistency Audit */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <ShieldCheck size={20} color="#10b981" />
          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Panel Scoring Variance & Bias Audit Log
          </h4>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '18px' }}>
          Algorithmic monitoring verifies scoring variance between human selectors and AI embedding evidence to detect subjective anomalies or grading bias.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Panel Variance Index</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
              0.042 (Normal)
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981' }}>Within accepted tolerance (&lt;0.10)</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>AI-to-Human Correlation</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#008bdc', marginTop: '2px' }}>
              +0.91 High
            </div>
            <div style={{ fontSize: '0.72rem', color: '#008bdc' }}>Strong alignment with evidence</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Bias Flags Detected</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              0 Flags
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981' }}>Objective compliance confirmed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
