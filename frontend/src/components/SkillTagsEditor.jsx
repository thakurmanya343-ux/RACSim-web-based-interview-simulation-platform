import React, { useState } from 'react';
import { Tag, Plus, X, ArrowRight, User, Mail, FileText, Sparkles, AlertCircle } from 'lucide-react';

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

    // Check if not already in list (case insensitive)
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

  // Filter suggestions to those not yet added
  const remainingSuggestions = COMMON_SUGGESTIONS.filter(
    s => !skills.some(c => c.toLowerCase() === s.toLowerCase())
  ).slice(0, 8);

  return (
    <div style={{ maxWidth: '820px', margin: '40px auto' }}>
      <div className="card" style={{ border: '1.5px solid #bfdbfe' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '18px', marginBottom: '22px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-green">CV Parsed Successfully</span>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                {candidate.originalFileName || 'Resume.pdf'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              Your Extracted Candidate Profile
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '2px' }}>
              Review and adjust your technical profile below before we calculate vacancy matches.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#008bdc' }}>
              {skills.length}
            </span>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              Skills Identified
            </div>
          </div>
        </div>

        {/* Candidate Info Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              <User size={14} color="#008bdc" /> Full Name
            </label>
            <input
              type="text"
              value={candidate.name || ''}
              onChange={(e) => onUpdateCandidate({ ...candidate, name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontWeight: 600
              }}
              placeholder="e.g. Full Name"
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              <Mail size={14} color="#008bdc" /> Email Address
            </label>
            <input
              type="email"
              value={candidate.email || ''}
              onChange={(e) => onUpdateCandidate({ ...candidate, email: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontWeight: 600
              }}
              placeholder="e.g. candidate@example.com"
            />
          </div>
        </div>

        {/* Editable Skills Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
              <Tag size={16} color="#008bdc" /> Extracted Skill Tags
            </label>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Click (×) to remove or type to add more
            </span>
          </div>

          {/* Skill Tag Chips */}
          <div
            style={{
              minHeight: '80px',
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            {skills.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.88rem' }}>
                <AlertCircle size={16} />
                No skills detected automatically. Please add your key skills below to find matches.
              </div>
            ) : (
              skills.map((skill) => (
                <span
                  key={skill}
                  className="tag-chip active"
                  style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                >
                  {skill}
                  <span
                    className="tag-chip-remove"
                    onClick={() => handleRemoveSkill(skill)}
                    title={`Remove ${skill}`}
                  >
                    <X size={12} />
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
            value={newSkillInput}
            onChange={(e) => setNewSkillInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type any skill (e.g. PyTorch, React, Kubernetes) and press Enter"
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              outline: 'none'
            }}
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => handleAddSkill()}
          >
            <Plus size={16} /> Add Skill
          </button>
        </div>

        {/* Quick Add Suggestions */}
        {remainingSuggestions.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginRight: '8px' }}>
              Quick Suggestions:
            </span>
            <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {remainingSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleAddSkill(suggestion)}
                  style={{
                    fontSize: '0.75rem',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            AI relevance engine will compare your {skills.length} skills with all advertised posts
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: '1rem' }}
            onClick={onProceed}
          >
            Find Matching Vacancies <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
