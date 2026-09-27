import React, { useState } from 'react';
import { Tag, Plus, X, ArrowUpRight, User, Mail, FileText, Sparkles, AlertCircle } from 'lucide-react';

const COMMON_SUGGESTIONS = [
  'Python', 'React', 'Node.js', 'Machine Learning', 'Computer Vision',
  'Deep Learning', 'SQL', 'TypeScript', 'Docker', 'AWS',
  'Project Management', 'Agile', 'Communication', 'Scikit-Learn', 'PyTorch'
];

export default function SkillTagsEditor({
  candidate,
  skills,
  onUpdateSkills,
  onUpdateCandidate,
  onProceed
}) {
  const [newSkillInput, setNewSkillInput] = useState('');

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || newSkillInput).trim();
    if (!trimmed) return;

    const exists = skills.some(s => s.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      onUpdateSkills([...skills, trimmed]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    onUpdateSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const remainingSuggestions = COMMON_SUGGESTIONS.filter(
    s => !skills.some(c => c.toLowerCase() === s.toLowerCase())
  ).slice(0, 8);

  return (
    <div style={{ maxWidth: '860px', margin: '40px auto', padding: '0 20px' }}>
      <div className="card" style={{ padding: '36px 36px 30px 36px', boxShadow: 'var(--shadow-lg)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-forest">CV Parsed Successfully</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {candidate.originalFileName || 'Resume.pdf'}
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 500, color: '#111111', margin: 0 }}>
              Candidate Competencies Dossier
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#57534E', marginTop: '4px' }}>
              Verify your parsed profile and technical proficiencies before alignment calculation.
            </p>
          </div>
        </div>

        {/* Candidate Basic Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
              <User size={14} color="var(--forest-green)" /> Full Name
            </label>
            <input
              type="text"
              className="form-input"
              value={candidate.name || ''}
              onChange={(e) => onUpdateCandidate({ ...candidate, name: e.target.value })}
              placeholder="e.g. Candidate Name"
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
              <Mail size={14} color="var(--forest-green)" /> Email Address
            </label>
            <input
              type="email"
              className="form-input"
              value={candidate.email || ''}
              onChange={(e) => onUpdateCandidate({ ...candidate, email: e.target.value })}
              placeholder="e.g. candidate@example.com"
            />
          </div>
        </div>

        {/* Editable Skills Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: 600, color: '#111111' }}>
              <Tag size={15} color="var(--forest-green)" /> Extracted Competency Tags ({skills.length})
            </label>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Click (×) to remove or type to add more
            </span>
          </div>

          {/* Skill Tag Chips */}
          <div
            style={{
              minHeight: '80px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border)',
              backgroundColor: 'var(--bg-card-warm)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            {skills.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <AlertCircle size={16} />
                No skills detected automatically. Please add your key skills below to find matches.
              </div>
            ) : (
              skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    color: '#111111',
                    border: '1px solid var(--border)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {skill}
                  <span
                    onClick={() => handleRemoveSkill(skill)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.06)'
                    }}
                    title={`Remove ${skill}`}
                  >
                    <X size={11} />
                  </span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Add Skill Input */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
          <input
            type="text"
            className="form-input"
            value={newSkillInput}
            onChange={(e) => setNewSkillInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type any skill (e.g. PyTorch, React, Kubernetes) and press Enter"
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => handleAddSkill()}
            style={{ padding: '0 20px', flexShrink: 0 }}
          >
            <Plus size={16} /> Add Tag
          </button>
        </div>

        {/* Quick Add Suggestions */}
        {remainingSuggestions.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '8px' }}>
              Suggested Additions:
            </span>
            <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {remainingSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleAddSkill(suggestion)}
                  style={{
                    fontSize: '0.76rem',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-full)',
                    padding: '4px 10px',
                    color: '#111111',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Semantic engine will match {skills.length} competencies against board vacancies
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: '0.96rem' }}
            onClick={onProceed}
          >
            Find Matching Vacancies <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
