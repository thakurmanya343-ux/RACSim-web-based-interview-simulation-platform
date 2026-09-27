import React from 'react';
import { Award, CheckCircle, ShieldCheck, Sparkles, TrendingUp, Users, Brain, Zap, UserCheck, FileText } from 'lucide-react';

export default function HeroIllustration({ candidate, skills = [] }) {
  const hasCandidate = Boolean(candidate && candidate.name && candidate.name !== 'Candidate' && candidate.name.trim().length > 0);
  const candidateName = hasCandidate ? candidate.name : 'Candidate Evaluation';
  const candidateTrack = hasCandidate ? (candidate.domain || 'Verified Competency Track') : 'AI Competency Matching';
  const initials = hasCandidate
    ? candidate.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : null;

  const skillsCount = skills ? skills.length : 0;
  const statusText = hasCandidate
    ? (skillsCount > 0 ? `${skillsCount} Verified Skills Extracted • Resume Analyzed` : 'Resume Uploaded • Parsing Ready')
    : 'Upload CV to extract skills & calculate cosine match';

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '520px', margin: '0 auto' }}>
      {/* Decorative background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-15px',
          right: '-15px',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(0,139,220,0.18) 0%, rgba(255,255,255,0) 70%)',
          borderRadius: '50%',
          filter: 'blur(30px)',
          zIndex: 0
        }}
      />

      {/* Main Glass Simulation Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'linear-gradient(145deg, #ffffff 0%, #f0f7fe 100%)',
          borderRadius: '20px',
          border: '1.5px solid #bfdbfe',
          boxShadow: '0 20px 45px rgba(0, 139, 220, 0.12), 0 4px 12px rgba(0,0,0,0.04)',
          padding: '24px',
          overflow: 'hidden'
        }}
      >
        {/* Top Header of Simulated Board */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', marginLeft: '6px' }}>
              Selector Simulation Room
            </span>
          </div>
          <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            {hasCandidate ? 'Candidate Active' : 'AI Board Engine Ready'}
          </span>
        </div>

        {/* Candidate Evaluation Highlight */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #dbeafe', marginBottom: '18px' }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #008bdc, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: initials ? '1.25rem' : '1.1rem'
              }}
            >
              {initials ? initials : <UserCheck size={26} color="#ffffff" />}
            </div>
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: '#10b981', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
              ✓
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {hasCandidate ? `Candidate: ${candidateName}` : 'Candidate Evaluation'}
              </h4>
              <span style={{ fontSize: '0.78rem', color: '#008bdc', fontWeight: 700, background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                {candidateTrack}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px', margin: 0 }}>
              {statusText}
            </p>
          </div>
        </div>

        {/* Real-time Match & Relevance Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
              <Sparkles size={14} color="#008bdc" />
              <span>Skill Match Engine</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#008bdc' }}>
                {skillsCount > 0 ? `${skillsCount} Skills` : 'Cosine Sim'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                {skillsCount > 0 ? 'Extracted' : 'Dynamic AI'}
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', marginTop: '6px', overflow: 'hidden' }}>
              <div
                style={{
                  width: skillsCount > 0 ? `${Math.min(100, Math.max(30, skillsCount * 10))}%` : '75%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #008bdc, #10b981)'
                }}
              />
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
              <Brain size={14} color="#7c3aed" />
              <span>Vector Similarity</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c3aed' }}>
                55+ Skills
              </span>
            </div>
            <span style={{ fontSize: '0.73rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
              Standardized Taxonomy
            </span>
          </div>
        </div>

        {/* Live Question Relevance Stream */}
        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Adaptive Question Engine:
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#008bdc', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px' }}>
              5-Stage Rubric
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#1e293b', fontStyle: 'italic', margin: 0, lineHeight: 1.4 }}>
            "Questions adapt in real time to candidate expertise, spanning ice breaking, project depth, and core technical problem solving."
          </p>
        </div>
      </div>

      {/* Floating Badges */}
      <div
        style={{
          position: 'absolute',
          bottom: '-12px',
          left: '-16px',
          background: '#ffffff',
          padding: '10px 16px',
          borderRadius: '12px',
          border: '1px solid #bfdbfe',
          boxShadow: '0 8px 20px rgba(0, 139, 220, 0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 2
        }}
      >
        <div style={{ background: '#ecfdf5', padding: '6px', borderRadius: '8px' }}>
          <ShieldCheck size={20} color="#10b981" />
        </div>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>Fair & Objective</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Zero Evaluation Bias</div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '-12px',
          right: '-10px',
          background: '#ffffff',
          padding: '10px 16px',
          borderRadius: '12px',
          border: '1px solid #bfdbfe',
          boxShadow: '0 8px 20px rgba(0, 139, 220, 0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 2
        }}
      >
        <div style={{ background: '#eff6ff', padding: '6px', borderRadius: '8px' }}>
          <TrendingUp size={20} color="#008bdc" />
        </div>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>Selector Board</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Live Simulation Coordination</div>
        </div>
      </div>
    </div>
  );
}
