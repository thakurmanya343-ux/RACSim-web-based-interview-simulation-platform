import React, { useState } from 'react';
import { Briefcase, CheckCircle2, ChevronRight, Sparkles, MapPin, DollarSign, Clock, ArrowLeft, Check, AlertCircle } from 'lucide-react';

export default function JobRecommendations({
  candidate,
  skills,
  vacancies,
  appliedVacancyIds,
  applications = [],
  onApply,
  onAcceptSchedule,
  onEnterBoardRoom,
  onBackToEdit,
  applicationConfirmation
}) {
  const [selectedDomain, setSelectedDomain] = useState('All');

  // Check if any application for this candidate has been scheduled or accepted
  const scheduledApp = applications.find(a =>
    (a.candidateId === candidate?.id || a.candidateEmail === candidate?.email) &&
    (a.status === 'Interview Scheduled' || a.status === 'Accepted')
  );

  // Filter vacancies
  const filteredVacancies = vacancies.filter(v => {
    if (selectedDomain === 'All') return true;
    return v.domain.toLowerCase().includes(selectedDomain.toLowerCase());
  });

  const domains = ['All', 'AI / Machine Learning', 'Web Development', 'Data Analysis', 'Project Management'];

  return (
    <div style={{ maxWidth: '960px', margin: '36px auto' }}>
      {/* Top Banner & Candidate Summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #008bdc 0%, #1e40af 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: '28px',
          boxShadow: '0 10px 25px rgba(0, 139, 220, 0.2)'
        }}
      >
        <div>
          <button
            onClick={onBackToEdit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#dbeafe',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '8px'
            }}
          >
            <ArrowLeft size={14} /> Edit Extracted Skills ({skills.length})
          </button>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Matched Job Openings for {candidate.name || 'Candidate'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#e0f2fe', marginTop: '4px' }}>
            Openings ranked dynamically using AI cosine similarity between your profile and job skill requirements.
          </p>
        </div>

        <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.15)', padding: '12px 18px', borderRadius: '12px', backdropFilter: 'blur(4px)' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {filteredVacancies.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#e0f2fe', fontWeight: 600, textTransform: 'uppercase' }}>
            Relevant Roles
          </div>
        </div>
      </div>

      {/* Scheduled Interview Alert Banner (Candidate Notification) */}
      {scheduledApp && (
        <div
          style={{
            background: scheduledApp.status === 'Accepted' ? '#f0fdf4' : '#fffbeb',
            border: scheduledApp.status === 'Accepted' ? '1.5px solid #10b981' : '1.5px solid #f59e0b',
            borderRadius: '14px',
            padding: '18px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: scheduledApp.status === 'Accepted' ? '#10b981' : '#f59e0b',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                {scheduledApp.status === 'Accepted'
                  ? '🎉 Interview Confirmed & Ready!'
                  : '🔔 Interview Invitation Received from Selector Panel!'}
              </div>
              <div style={{ color: '#475569', fontSize: '0.88rem', marginTop: '2px' }}>
                Position: <strong>{scheduledApp.vacancyTitle || 'Applied Role'}</strong>
                {scheduledApp.scheduledAt && (
                  <span>
                    {' '}• Slot: <strong>{new Date(scheduledApp.scheduledAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {scheduledApp.status === 'Accepted' ? (
              <button
                className="btn btn-primary"
                onClick={() => onEnterBoardRoom && onEnterBoardRoom(scheduledApp)}
                style={{ background: '#10b981', padding: '10px 22px', fontSize: '0.92rem' }}
              >
                🎙️ Enter Board Room Now
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => onAcceptSchedule && onAcceptSchedule(scheduledApp)}
                style={{ background: '#f59e0b', color: '#000', fontWeight: 800, padding: '10px 22px', fontSize: '0.92rem' }}
              >
                ✓ Accept Request & Enter Board Room
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Message Popup if user just applied */}
      {applicationConfirmation && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1.5px solid #10b981',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Check size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#065f46', fontSize: '0.96rem' }}>
                Application sent successfully!
              </div>
              <div style={{ color: '#047857', fontSize: '0.86rem' }}>
                The interviewer will reach out to schedule your interview. Status: <strong>Pending Schedule</strong>
              </div>
            </div>
          </div>
          <span className="badge badge-green" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            Status: Pending Schedule
          </span>
        </div>
      )}

      {/* Domain Filters */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
        {domains.map(d => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDomain(d)}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: selectedDomain === d ? '1.5px solid #008bdc' : '1px solid #cbd5e1',
              backgroundColor: selectedDomain === d ? '#e0f2fe' : '#ffffff',
              color: selectedDomain === d ? '#008bdc' : '#475569',
              whiteSpace: 'nowrap'
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Vacancy Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {filteredVacancies.map((vacancy) => {
          const matchingApp = applications.find(a =>
            (a.candidateId === candidate?.id || a.candidateEmail === candidate?.email) &&
            a.vacancyId === vacancy.id
          );
          const isApplied = appliedVacancyIds.includes(vacancy.id) || Boolean(matchingApp);
          const score = vacancy.matchScore || 50;

          // Determine progress bar tone
          let scoreClass = 'low';
          let scoreBadgeBg = '#fef3c7';
          let scoreBadgeColor = '#b45309';

          if (score >= 75) {
            scoreClass = 'high';
            scoreBadgeBg = '#d1fae5';
            scoreBadgeColor = '#065f46';
          } else if (score >= 45) {
            scoreClass = 'mid';
            scoreBadgeBg = '#e0f2fe';
            scoreBadgeColor = '#0369a1';
          }

          return (
            <div
              key={vacancy.id}
              className="card"
              style={{
                border: isApplied ? '1.5px solid #10b981' : '1.5px solid #e2e8f0',
                padding: '24px',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge badge-blue">{vacancy.domain}</span>
                    <span style={{ fontSize: '0.78rem', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {vacancy.level}
                    </span>
                    {vacancy.isAiPowered && (
                      <span style={{ fontSize: '0.74rem', background: '#fdf4ff', color: '#a21caf', border: '1px solid #f0abfc', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={12} /> AI Cosine Match
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                    {vacancy.title}
                  </h3>

                  <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '14px', lineHeight: 1.5 }}>
                    {vacancy.description}
                  </p>

                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.84rem', color: '#64748b', marginBottom: '16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} color="#008bdc" /> {vacancy.location || 'Hybrid'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <DollarSign size={14} color="#10b981" /> {vacancy.salaryRange || 'Competitive'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} color="#64748b" /> {vacancy.experienceRequired || 'Relevant experience'}
                    </span>
                  </div>
                </div>

                {/* Match Score Indicator Box */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '16px',
                    minWidth: '190px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                    Skill Match Score
                  </div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 800, color: scoreBadgeColor }}>
                    {score}%
                  </div>
                  
                  {/* Progress bar */}
                  <div className="progress-container" style={{ margin: '8px 0 10px 0' }}>
                    <div
                      className={`progress-fill ${scoreClass}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>

                  <span
                    style={{
                      background: scoreBadgeBg,
                      color: scoreBadgeColor,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '999px'
                    }}
                  >
                    {score >= 75 ? 'Strong Match' : score >= 45 ? 'Moderate Match' : 'Potential Match'}
                  </span>
                </div>
              </div>

              {/* Skills Breakdown Tags */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '12px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  Required Competencies:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  {vacancy.requiredSkills.map(reqSkill => {
                    const isMatched = skills.some(s => s.toLowerCase() === reqSkill.toLowerCase());
                    return (
                      <span
                        key={reqSkill}
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          padding: '3px 9px',
                          borderRadius: '6px',
                          background: isMatched ? '#ecfdf5' : '#f8fafc',
                          color: isMatched ? '#047857' : '#64748b',
                          border: isMatched ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {isMatched ? '✓' : '•'} {reqSkill}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '14px' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Algorithm: {vacancy.matchAlgorithm || 'AI Semantic Cosine Vector'}
                </span>

                {matchingApp?.status === 'Accepted' ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => onEnterBoardRoom && onEnterBoardRoom(matchingApp)}
                    style={{ background: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle2 size={16} /> Enter Board Room
                  </button>
                ) : matchingApp?.status === 'Interview Scheduled' ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => onAcceptSchedule && onAcceptSchedule(matchingApp)}
                    style={{ background: '#f59e0b', color: '#000', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle2 size={16} /> Accept & Enter Board Room
                  </button>
                ) : isApplied ? (
                  <button
                    disabled
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#ecfdf5',
                      color: '#065f46',
                      border: '1.5px solid #10b981',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'default'
                    }}
                  >
                    <CheckCircle2 size={18} color="#10b981" />
                    Applied • Pending Schedule
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => onApply(vacancy)}
                    style={{ padding: '10px 24px' }}
                  >
                    Apply for this Role
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
