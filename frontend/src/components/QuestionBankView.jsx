import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, Filter, CheckCircle2, ChevronRight, Layers, Tag } from 'lucide-react';

export default function QuestionBankView({ candidate }) {
  const [questions, setQuestions] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [stageFilter, setStageFilter] = useState('All');
  const [domainFilter, setDomainFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('bank'); // 'bank' | 'recommended'
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [stageFilter, domainFilter]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (stageFilter !== 'All') params.append('stage', stageFilter);
      if (domainFilter !== 'All') params.append('domain', domainFilter);

      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      if (data.data) {
        setQuestions(data.data);
      }
    } catch (e) {
      console.error('Error fetching questions:', e);
    }
    setIsLoading(false);
  };

  const handleFetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const candId = candidate?.id || 'cand-001';
      const res = await fetch(`/api/questions/recommend?candidateId=${candId}&limit=5`);
      const data = await res.json();
      if (data.data) {
        setRecommended(data.data);
      }
    } catch (e) {
      console.error('Error fetching recommendations:', e);
    }
    setIsLoading(false);
  };

  return (
    <div style={{ maxWidth: '1060px', margin: '30px auto' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #008bdc 0%, #1e40af 100%)',
          borderRadius: '16px',
          padding: '24px 30px',
          color: '#ffffff',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <span className="badge badge-blue" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', marginBottom: '6px' }}>
            Board Room Evaluation Rubrics
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            Structured Question Bank & AI Recommender
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#e0f2fe', marginTop: '4px' }}>
            Multi-stage question bank calibrated across 5 sequential board room stages.
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.15)', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setActiveTab('bank')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'bank' ? '#ffffff' : 'transparent',
              color: activeTab === 'bank' ? '#008bdc' : '#ffffff',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer'
            }}
          >
            Question Bank ({questions.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('recommended');
              if (recommended.length === 0) handleFetchRecommendations();
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'recommended' ? '#ffffff' : 'transparent',
              color: activeTab === 'recommended' ? '#008bdc' : '#ffffff',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer'
            }}
          >
            AI Recommendations ✨
          </button>
        </div>
      </div>

      {activeTab === 'bank' ? (
        <div>
          {/* Filters Bar */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} color="#008bdc" /> Filter Questions:
            </span>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
            >
              <option value="All">All Stages</option>
              <option value="IceBreaking">1. IceBreaking</option>
              <option value="ProjectDiscussion">2. ProjectDiscussion</option>
              <option value="TechnicalCore">3. TechnicalCore</option>
              <option value="ProblemSolving">4. ProblemSolving</option>
              <option value="BoardWrapUp">5. BoardWrapUp</option>
            </select>

            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.86rem' }}
            >
              <option value="All">All Domains</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="Software Engineering">Software Engineering</option>
            </select>
          </div>

          {/* Questions Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {questions.map((q) => (
              <div key={q.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge badge-blue">{q.stage}</span>
                    <span style={{ fontSize: '0.76rem', background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      Level {q.difficulty} / 3
                    </span>
                    <span style={{ fontSize: '0.76rem', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {q.domain}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    #{q.id}
                  </span>
                </div>

                <h4 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
                  {q.text}
                </h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                    Expected Concepts:
                  </span>
                  {(q.expectedConcepts || []).map((concept) => (
                    <span
                      key={concept}
                      style={{
                        fontSize: '0.74rem',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        color: '#334155'
                      }}
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Recommended View */
        <div>
          <div className="card" style={{ padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Questions Tailored to Candidate Profile ({candidate?.name || 'Candidate'})
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0 0' }}>
                AI analyzes candidate CV skills and maps them to domain question requirements.
              </p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={handleFetchRecommendations}>
              <Sparkles size={14} /> Refresh AI Recommendations
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recommended.map((r, idx) => (
              <div key={r.id || idx} className="card" style={{ padding: '22px', borderLeft: '4px solid #008bdc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge badge-green">Recommended Match</span>
                    <span className="badge badge-blue">{r.stage}</span>
                    <span style={{ fontSize: '0.76rem', background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      Level {r.difficulty}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#008bdc', fontWeight: 700 }}>
                    {r.matchedSkillsCount || 3} Matched Skills
                  </span>
                </div>

                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 10px 0' }}>
                  {r.text}
                </h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Matched Candidate Skills:</span>
                  {(r.matchedSkills || ['Python', 'Computer Vision', 'Deep Learning']).map(sk => (
                    <span key={sk} style={{ fontSize: '0.74rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
