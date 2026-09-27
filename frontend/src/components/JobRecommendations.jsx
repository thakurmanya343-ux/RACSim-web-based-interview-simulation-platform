import React, { useState } from 'react';
import { Briefcase, CheckCircle2, ChevronRight, Sparkles, MapPin, DollarSign, Clock, ArrowLeft, Check, AlertCircle, ArrowUpRight, Calendar } from 'lucide-react';

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
    <div style={{ maxWidth: '980px', margin: '40px auto', padding: '0 20px' }}>
      {/* Top Banner & Candidate Summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#111111',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div>
          <button
            onClick={onBackToEdit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#A8A29E',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '10px'
            }}
          >
            <ArrowLeft size={14} /> Back to Competency Tags ({skills.length})
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest-green-border)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              02 Selector Vacancies
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', fontWeight: 500, color: '#ffffff', margin: 0 }}>
            Matched Roles for {candidate.name || 'Candidate'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#D6CEC0', marginTop: '4px' }}>
            Positions ranked objectively using cosine semantic similarity between your profile and job competencies.
          </p>
        </div>

        <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.08)', padding: '14px 20px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 700 }}>
            {filteredVacancies.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#A8A29E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Matching Vacancies
          </div>
        </div>
      </div>

      {/* Scheduled Interview Alert Banner (Candidate Notification) */}
      {scheduledApp && (
        <div
          style={{
            background: scheduledApp.status === 'Accepted' ? 'var(--forest-green-bg)' : '#FEF9EE',
            border: scheduledApp.status === 'Accepted' ? '1.5px solid var(--forest-green-border)' : '1.5px solid #FDE68A',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 26px',
            marginBottom: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: scheduledApp.status === 'Accepted' ? 'var(--forest-green)' : '#D97706',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#111111', fontSize: '1.02rem', fontFamily: 'var(--font-serif)' }}>
                {scheduledApp.status === 'Accepted'
                  ? 'Board Room Assessment Confirmed & Ready'
                  : 'Official Selector Panel Interview Invitation Received'}
              </div>
              <div style={{ color: '#57534E', fontSize: '0.86rem', marginTop: '2px' }}>
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
                className="btn btn-forest"
                onClick={() => onEnterBoardRoom && onEnterBoardRoom(scheduledApp)}
                style={{ padding: '10px 22px', fontSize: '0.92rem' }}
              >
                🎙️ Enter Board Room Now
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => onAcceptSchedule && onAcceptSchedule(scheduledApp)}
                style={{ padding: '10px 22px', fontSize: '0.92rem' }}
              >
                ✓ Accept Invitation & Unlock Board Room
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Message Popup if user just applied */}
      {applicationConfirmation && (
        <div
          style={{
            background: 'var(--forest-green-bg)',
            border: '1.5px solid var(--forest-green-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--forest-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Check size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--forest-green)', fontSize: '0.95rem' }}>
                Application dossier submitted successfully!
              </div>
              <div style={{ color: '#57534E', fontSize: '0.85rem' }}>
                The selector board panel will review your credentials and issue a simulation meeting schedule.
              </div>
            </div>
          </div>
          <span className="badge badge-forest" style={{ fontSize: '0.78rem' }}>
            Status: Pending Review
          </span>
        </div>
      )}

      {/* Domain Filters */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '22px' }}>
        {domains.map(d => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDomain(d)}
            style={{
              padding: '7px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.84rem',
              fontWeight: selectedDomain === d ? 700 : 500,
              border: selectedDomain === d ? '1.5px solid #111111' : '1px solid var(--border)',
              backgroundColor: selectedDomain === d ? '#111111' : '#FFFFFF',
              color: selectedDomain === d ? '#FFFFFF' : '#57534E',
              whiteSpace: 'nowrap'
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Vacancy Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredVacancies.map((vacancy) => {
          const matchingApp = applications.find(a =>
            (a.candidateId === candidate?.id || a.candidateEmail === candidate?.email) &&
            a.vacancyId === vacancy.id
          );
          const isApplied = appliedVacancyIds.includes(vacancy.id) || Boolean(matchingApp);
          const score = vacancy.matchScore || 50;

          return (
            <div
              key={vacancy.id}
              className="card"
              style={{
                border: isApplied ? '1.5px solid var(--forest-green)' : '1.5px solid var(--border)',
                padding: '28px',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className="badge badge-sand">{vacancy.domain}</span>
                    <span style={{ fontSize: '0.76rem', background: 'var(--bg-subtle)', color: 'var(--text-muted)', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {vacancy.level}
                    </span>
                    {vacancy.isAiPowered && (
                      <span className="badge badge-forest" style={{ fontSize: '0.72rem' }}>
                        <Sparkles size={11} /> AI Cosine Match
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 600, color: '#111111', marginBottom: '8px' }}>
                    {vacancy.title}
                  </h3>

                  <p style={{ fontSize: '0.9rem', color: '#57534E', marginBottom: '16px', lineHeight: 1.55 }}>
                    {vacancy.description}
                  </p>

                  <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} color="var(--forest-green)" /> {vacancy.location || 'Hybrid'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <DollarSign size={14} color="var(--forest-green)" /> {vacancy.salaryRange || 'Competitive'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} color="var(--forest-green)" /> {vacancy.experienceRequired || 'Relevant experience'}
                    </span>
                  </div>
                </div>

                {/* Match Score Indicator Box */}
                <div
                  style={{
                    background: 'var(--bg-card-warm)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px 22px',
                    minWidth: '180px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                    Match Precision
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 700, color: score >= 70 ? 'var(--forest-green)' : '#111111' }}>
                    {score}%
                  </div>

                  <span
                    className={score >= 70 ? 'badge badge-forest' : 'badge badge-sand'}
                    style={{ marginTop: '6px' }}
                  >
                    {score >= 75 ? 'Strong Match' : score >= 45 ? 'Moderate Match' : 'Potential Match'}
                  </span>
                </div>
              </div>

              {/* Skills Breakdown Tags */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
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
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: isMatched ? 'var(--forest-green-bg)' : 'var(--bg-subtle)',
                          color: isMatched ? 'var(--forest-green)' : 'var(--text-muted)',
                          border: isMatched ? '1px solid var(--forest-green-border)' : '1px solid var(--border)',
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

              {/* Bottom Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                {isApplied ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--forest-green)',
                      fontWeight: 700,
                      fontSize: '0.88rem'
                    }}
                  >
                    <CheckCircle2 size={16} /> Application Under Panel Review
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onApply(vacancy)}
                  >
                    Submit Candidate Dossier <ArrowUpRight size={14} />
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
