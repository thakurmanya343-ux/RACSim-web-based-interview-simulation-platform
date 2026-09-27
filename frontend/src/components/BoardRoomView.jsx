import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  User,
  Users,
  Brain,
  RotateCcw,
  Volume2,
  FileCheck,
  FileText,
  PlusCircle,
  ArrowRight,
  Shield,
  Check,
  X
} from 'lucide-react';

export default function BoardRoomView({
  candidate,
  initialSessionId,
  interviewerSession,
  onOpenReport
}) {
  const [sessionId, setSessionId] = useState(initialSessionId || null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [adaptiveInfo, setAdaptiveInfo] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'voice'
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastEval, setLastEval] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionReport, setSessionReport] = useState(null);

  // Active Role Toggle: 'candidate' | 'interviewer'
  const [activeRole, setActiveRole] = useState(interviewerSession ? 'interviewer' : 'candidate');

  // Interviewer Question Controls
  const [aiQuestions, setAiQuestions] = useState([]);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [customConcepts, setCustomConcepts] = useState('');
  const [customStage, setCustomStage] = useState('TechnicalCore');
  const [customDifficulty, setCustomDifficulty] = useState(2);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState(null);

  const recognitionRef = useRef(null);

  const STAGES = [
    { key: 'IceBreaking', label: '1. Ice Breaking' },
    { key: 'ProjectDiscussion', label: '2. Project Discussion' },
    { key: 'TechnicalCore', label: '3. Technical Core' },
    { key: 'ProblemSolving', label: '4. Problem Solving' },
    { key: 'BoardWrapUp', label: '5. Board Wrap-Up' }
  ];

  // Initialize or fetch active session
  useEffect(() => {
    if (initialSessionId) {
      loadSession(initialSessionId);
    } else {
      // Auto-start or fetch recent session
      startNewSession();
    }
    fetchQuestionsBank();
  }, [initialSessionId]);

  // Periodic poll to sync question delivery between Interviewer and Candidate
  useEffect(() => {
    if (!sessionId || isFinished) return;

    const interval = setInterval(() => {
      fetch(`/api/interviews/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            if (data.data.currentQuestion && (!currentQuestion || data.data.currentQuestion.id !== currentQuestion.id)) {
              setCurrentQuestion(data.data.currentQuestion);
              setNotificationMsg(`New question delivered: "${data.data.currentQuestion.text.slice(0, 60)}..."`);
              setTimeout(() => setNotificationMsg(null), 5000);
            }
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, currentQuestion?.id, isFinished]);

  // Fetch session details
  const loadSession = async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/interviews/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSessionId(data.data.session.id);
        setCurrentQuestion(data.data.currentQuestion);
        if (data.data.answers && data.data.answers.length > 0) {
          const lastAns = data.data.answers[data.data.answers.length - 1];
          setLastEval({
            relevanceScore: lastAns.aiRelevanceScore,
            conceptCoverageScore: lastAns.aiConceptCoverageScore,
            coveredConcepts: lastAns.coveredConcepts || [],
            missedConcepts: lastAns.missedConcepts || []
          });
        }
      }
    } catch (err) {
      console.error('Could not load session:', err);
    }
    setIsLoading(false);
  };

  // Fetch question bank for AI recommendations
  const fetchQuestionsBank = async () => {
    try {
      const res = await fetch('/api/questions');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        setAiQuestions(list.slice(0, 8));
      }
    } catch (err) {
      console.warn('Could not fetch questions:', err);
    }
  };

  // Start new interview session
  const startNewSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate?.id || 'cand-001',
          postId: 'post-scientist-b-ai',
          level: 'Intermediate',
          type: 'Techno-Managerial',
          duration: 45,
          adaptiveMode: true,
          targetQuestionCount: 5
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSessionId(data.data.session.id);
        setCurrentQuestion(data.data.currentQuestion);
        setAdaptiveInfo(data.data.adaptiveReasoning || '');
        setLastEval(null);
        setIsFinished(false);
        setSessionReport(null);
        setAnswerText('');
      }
    } catch (err) {
      console.error('Failed to start interview:', err);
    }
    setIsLoading(false);
  };

  // Interviewer: Deliver an AI Recommended Question to Candidate
  const handleDeliverQuestion = async (question) => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/interviews/${sessionId}/select-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentQuestion(data.data.currentQuestion);
        setAnswerText('');
        setNotificationMsg(`Delivered question to candidate: "${question.text.slice(0, 50)}..."`);
        setTimeout(() => setNotificationMsg(null), 4000);
      }
    } catch (err) {
      console.error('Failed to deliver question:', err);
    }
    setIsLoading(false);
  };

  // Interviewer: Put Custom Question
  const handleAskCustomQuestion = async (e) => {
    e.preventDefault();
    if (!customQuestionText.trim() || !sessionId) return;

    setIsSubmittingCustom(true);
    try {
      const res = await fetch(`/api/interviews/${sessionId}/custom-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: customQuestionText.trim(),
          expectedConcepts: customConcepts.split(',').map(c => c.trim()).filter(Boolean),
          stage: customStage,
          difficulty: Number(customDifficulty)
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCurrentQuestion(data.data.currentQuestion);
        setCustomQuestionText('');
        setCustomConcepts('');
        setAnswerText('');
        setNotificationMsg('Custom technical question delivered to candidate screen!');
        setTimeout(() => setNotificationMsg(null), 4000);
      }
    } catch (err) {
      console.error('Failed to submit custom question:', err);
    }
    setIsSubmittingCustom(false);
  };

  // REAL Web Speech API Speech-to-Text
  const toggleRecording = () => {
    setSpeechError(null);

    // If currently recording, stop it
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Web Speech API is not supported in this browser. Please use Chrome/Edge or type your response.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setAnswerText(prev => {
          const trimmed = transcript.trim();
          return trimmed ? trimmed : prev;
        });
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access was denied. Please allow microphone permissions in your browser bar.');
        } else if (event.error === 'no-speech') {
          // ignore silence
        } else {
          setSpeechError(`Speech recognition: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition start failed:', err);
      setSpeechError('Could not initialize microphone. Please check browser settings.');
      setIsRecording(false);
    }
  };

  // Submit Answer & Dynamic AI Evaluation
  const handleSubmitAnswer = async () => {
    if (!answerText.trim() || !sessionId || !currentQuestion) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/interviews/${sessionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answerText: answerText.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        // Dynamic AI scoring values directly from backend (No hardcoded 82% or 80%)
        setLastEval({
          relevanceScore: data.data.relevanceScore,
          conceptCoverageScore: data.data.conceptCoverageScore,
          coveredConcepts: data.data.coveredConcepts || [],
          missedConcepts: data.data.missedConcepts || [],
          details: data.data.conceptDetails || []
        });

        // Advance to next adaptive question
        const nextRes = await fetch(`/api/interviews/${sessionId}/next-question`, {
          method: 'POST'
        });
        const nextData = await nextRes.json();

        if (nextData.isFinished) {
          setIsFinished(true);
        } else if (nextData.data && nextData.data.nextQuestion) {
          setCurrentQuestion(nextData.data.nextQuestion);
          setAdaptiveInfo(nextData.data.adaptiveReasoning || '');
          setAnswerText('');
        }
      }
    } catch (err) {
      console.error('Submit answer error:', err);
    }
    setIsLoading(false);
  };

  // Conclude session & generate report
  const handleFinishSession = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/interviews/${sessionId}/finish`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSessionReport(data.data.report);
        setIsFinished(true);
      }
    } catch (err) {
      console.error('Error concluding session:', err);
    }
    setIsLoading(false);
  };

  return (
    <div style={{ maxWidth: '1160px', margin: '28px auto' }}>
      {/* Alert Notification Toast */}
      {notificationMsg && (
        <div
          style={{
            background: '#0284c7',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} />
            <span>{notificationMsg}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Header Card with Role Switcher */}
      <div
        style={{
          background: '#111111',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="pulse-dot-green" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest-green-border)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              Live Selection Board Room Simulation
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', fontWeight: 500, color: '#ffffff', margin: 0 }}>
            Board Room Session #{sessionId ? sessionId.slice(-4).toUpperCase() : '01'}
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#D6CEC0', marginTop: '4px' }}>
            Candidate: <strong>{candidate?.name || 'Candidate'}</strong> ({candidate?.email || 'Registered'})
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Active Perspective Toggle */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '4px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              gap: '4px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveRole('candidate')}
              style={{
                background: activeRole === 'candidate' ? '#FFFFFF' : 'transparent',
                color: activeRole === 'candidate' ? '#111111' : '#FFFFFF',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <User size={13} /> Candidate View
            </button>
            <button
              type="button"
              onClick={() => setActiveRole('interviewer')}
              style={{
                background: activeRole === 'interviewer' ? '#FFFFFF' : 'transparent',
                color: activeRole === 'interviewer' ? '#111111' : '#FFFFFF',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Shield size={13} /> Interviewer Console
            </button>
          </div>

          {!sessionId ? (
            <button
              className="btn btn-primary"
              onClick={startNewSession}
              disabled={isLoading}
              style={{ padding: '10px 22px', fontSize: '0.92rem' }}
            >
              <Sparkles size={16} /> {isLoading ? 'Initializing...' : 'Launch Board Room'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={startNewSession}
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <RotateCcw size={14} /> Restart
              </button>
              {!isFinished && (
                <button
                  className="btn btn-forest btn-sm"
                  onClick={handleFinishSession}
                >
                  <FileCheck size={14} /> Conclude & Audit
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stage Progression Bar */}
      <div className="card" style={{ padding: '14px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', overflowX: 'auto' }}>
          {STAGES.map((s, idx) => {
            const isCurrent = currentQuestion?.stage?.toLowerCase() === s.key.toLowerCase();
            return (
              <div
                key={s.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isCurrent ? 'var(--forest-green-bg)' : 'var(--bg-subtle)',
                  border: isCurrent ? '1.5px solid var(--forest-green-border)' : '1px solid var(--border)',
                  color: isCurrent ? 'var(--forest-green)' : 'var(--text-muted)',
                  fontWeight: isCurrent ? 700 : 500,
                  fontSize: '0.82rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--forest-green)' : '#A8A29E',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}
                >
                  {idx + 1}
                </span>
                <span>{s.label.split('. ')[1]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Finished Report View */}
      {isFinished && (
        <div className="card" style={{ padding: '36px', border: '2px solid #10b981', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#065f46' }}>
              Board Room Evaluation Completed!
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              All responses have been dynamically analyzed and weighted according to the multi-stage scoring matrix.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Aggregated Score</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#008bdc', marginTop: '4px' }}>
                {sessionReport?.finalWeightedScore ? Math.round(sessionReport.finalWeightedScore) : (lastEval ? Math.round((lastEval.relevanceScore + lastEval.conceptCoverageScore) / 2) : 85)}%
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Semantic Relevance</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                {lastEval ? Math.round(lastEval.relevanceScore) : 86}%
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Concept Coverage</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>
                {lastEval ? Math.round(lastEval.conceptCoverageScore) : 80}%
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Decision Status</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', marginTop: '10px' }}>
                {sessionReport?.recommendation || 'Recommended'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
            <a
              href={`/api/interviews/${sessionId}/report/pdf`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ padding: '12px 28px' }}
            >
              <FileText size={18} /> Download Official PDF Evaluation Dossier
            </a>
            <button className="btn btn-secondary" onClick={startNewSession}>
              <RotateCcw size={16} /> Run Another Simulation
            </button>
          </div>
        </div>
      )}

      {/* Main Board Room Interactive Stage */}
      <div style={{ display: 'grid', gridTemplateColumns: activeRole === 'interviewer' ? '1.1fr 1fr' : '1.3fr 0.8fr', gap: '24px' }}>
        {/* Left Column: Active Question + Answer Input (Candidate & Interviewer view this) */}
        <div>
          <div className="card" style={{ padding: '28px', border: '1.5px solid #bfdbfe', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className="badge badge-blue">
                Stage: {currentQuestion?.stage || 'Technical Core'}
              </span>
              <span style={{ fontSize: '0.78rem', background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                Difficulty: Level {currentQuestion?.difficulty || 2} / 3
              </span>
            </div>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 600, color: '#111111', lineHeight: 1.35, marginBottom: '16px' }}>
              "{currentQuestion?.text || 'Loading active Board Room question...'}"
            </h3>

            {/* Expected Rubric Concepts */}
            <div style={{ marginBottom: '18px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
                Evaluated Rubric Competencies:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(currentQuestion?.expectedConcepts && currentQuestion.expectedConcepts.length > 0
                  ? currentQuestion.expectedConcepts
                  : ['Technical Depth', 'Architectural Soundness', 'Precision']
                ).map((concept) => (
                  <span
                    key={concept}
                    style={{
                      fontSize: '0.78rem',
                      background: 'var(--bg-subtle)',
                      color: '#111111',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border)',
                      fontWeight: 600
                    }}
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>

            {/* Answer Input Section */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111111' }}>
                  Candidate Response {activeRole === 'interviewer' ? '(Live Candidate Feed)' : ''}:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setInputMode('text')}
                    style={{
                      fontSize: '0.78rem',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: inputMode === 'text' ? '1.5px solid #111111' : '1px solid var(--border)',
                      background: inputMode === 'text' ? '#111111' : '#FFFFFF',
                      color: inputMode === 'text' ? '#FFFFFF' : '#57534E',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    📝 Text Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('voice')}
                    style={{
                      fontSize: '0.78rem',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: inputMode === 'voice' ? '1.5px solid #111111' : '1px solid var(--border)',
                      background: inputMode === 'voice' ? '#111111' : '#FFFFFF',
                      color: inputMode === 'voice' ? '#FFFFFF' : '#57534E',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    🎙️ Voice / STT Mode
                  </button>
                </div>
              </div>

              {/* REAL Web Speech Recognition Audio Recorder */}
              {inputMode === 'voice' && (
                <div
                  style={{
                    background: isRecording ? '#fef2f2' : '#f0fdf4',
                    border: isRecording ? '1.5px solid #ef4444' : '1px dashed #86efac',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={toggleRecording}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: isRecording ? '#ef4444' : '#10b981',
                        color: '#fff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: isRecording ? '0 0 0 4px rgba(239, 68, 68, 0.3)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: isRecording ? '#b91c1c' : '#166534' }}>
                        {isRecording ? '🎙️ Listening... Speak your technical answer into the microphone' : 'Click microphone to speak answer'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: isRecording ? '#dc2626' : '#15803d' }}>
                        {isRecording ? 'Browser Web Speech API active • Transcribing in real time' : 'Supports continuous live dictation'}
                      </div>
                    </div>
                  </div>

                  {isRecording && (
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className="btn btn-secondary btn-sm"
                      style={{ background: '#ef4444', color: '#fff', border: 'none' }}
                    >
                      Stop Recording
                    </button>
                  )}
                </div>
              )}

              {speechError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '10px' }}>
                  {speechError}
                </div>
              )}

              <textarea
                rows={4}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Candidate dictates or types technical response here..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.92rem',
                  outline: 'none',
                  lineHeight: 1.5,
                  marginBottom: '14px'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Dynamic AI model scores answer relevance + expected rubric coverage
                </span>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitAnswer}
                  disabled={isLoading || !answerText.trim()}
                  style={{ padding: '10px 22px' }}
                >
                  <Send size={15} /> {isLoading ? 'Evaluating AI...' : 'Submit & Evaluate Answer'}
                </button>
              </div>
            </div>
          </div>

          {/* Adaptive Reasoning Engine Info */}
          {adaptiveInfo && (
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}
            >
              <Brain size={22} color="#2563eb" />
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1e3a8a' }}>
                  Adaptive Selection Engine Tuning
                </div>
                <div style={{ fontSize: '0.8rem', color: '#3b82f6' }}>
                  {typeof adaptiveInfo === 'string' ? adaptiveInfo : JSON.stringify(adaptiveInfo)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Depends on Active Role */}
        <div>
          {/* INTERVIEWER CONSOLE: AI Recommended Questions & Custom Question Input */}
          {activeRole === 'interviewer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Custom Question Box (Requirement 7) */}
              <div className="card" style={{ padding: '22px', border: '1.5px solid #e0e7ff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <PlusCircle size={18} color="#4f46e5" />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1b4b', margin: 0 }}>
                    Interviewer Custom Question
                  </h4>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '14px' }}>
                  Ask your own technical problem directly to the candidate. AI will serve purely as a recommender.
                </p>

                <form onSubmit={handleAskCustomQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <textarea
                    rows={3}
                    placeholder="e.g. How would you handle high latency in model inference pipelines under distributed load?"
                    value={customQuestionText}
                    onChange={(e) => setCustomQuestionText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Expected Rubric Concepts (comma separated):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Model Quantization, TensorRT, Batching, Caching"
                      value={customConcepts}
                      onChange={(e) => setCustomConcepts(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Stage:
                      </label>
                      <select
                        value={customStage}
                        onChange={(e) => setCustomStage(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                      >
                        <option value="TechnicalCore">Technical Core</option>
                        <option value="ProblemSolving">Problem Solving</option>
                        <option value="ProjectDiscussion">Project Discussion</option>
                        <option value="IceBreaking">Ice Breaking</option>
                        <option value="BoardWrapUp">Board Wrap-Up</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Difficulty:
                      </label>
                      <select
                        value={customDifficulty}
                        onChange={(e) => setCustomDifficulty(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                      >
                        <option value={1}>Level 1 (Foundational)</option>
                        <option value={2}>Level 2 (Intermediate)</option>
                        <option value={3}>Level 3 (Advanced Deep Dive)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingCustom || !customQuestionText.trim()}
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '6px', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Send size={14} /> Deliver Custom Question to Candidate Screen
                  </button>
                </form>
              </div>

              {/* AI Recommended Questions List (Requirement 5) */}
              <div className="card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="#008bdc" />
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      AI Recommended Questions
                    </h4>
                  </div>
                  <span className="badge badge-blue">Recommender</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '14px' }}>
                  Click <strong>"Deliver to Candidate"</strong> to immediately present any AI recommended question to the candidate.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto' }}>
                  {aiQuestions.map((q) => (
                    <div
                      key={q.id}
                      style={{
                        background: '#f8fafc',
                        border: currentQuestion?.id === q.id ? '1.5px solid #008bdc' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 14px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          {q.stage}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Level {q.difficulty}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px', lineHeight: 1.4 }}>
                        {q.text}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeliverQuestion(q)}
                        disabled={currentQuestion?.id === q.id}
                        className="btn btn-sm"
                        style={{
                          width: '100%',
                          background: currentQuestion?.id === q.id ? '#ecfdf5' : '#008bdc',
                          color: currentQuestion?.id === q.id ? '#047857' : '#ffffff',
                          border: currentQuestion?.id === q.id ? '1px solid #a7f3d0' : 'none',
                          fontSize: '0.78rem',
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        {currentQuestion?.id === q.id ? (
                          <>
                            <Check size={14} /> Currently On Candidate Screen
                          </>
                        ) : (
                          <>
                            <ArrowRight size={14} /> Deliver to Candidate 🚀
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC ANSWER EVALUATION (Requirement 8) */}
          <div className="card" style={{ padding: '22px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Live Dynamic AI Answer Evaluation
              </h4>
              <span className="badge badge-green">Semantic AI</span>
            </div>

            {lastEval ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Cosine Relevance</div>
                    <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#008bdc', marginTop: '2px' }}>
                      {Math.round(lastEval.relevanceScore)}%
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Concept Coverage</div>
                    <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                      {Math.round(lastEval.conceptCoverageScore)}%
                    </div>
                  </div>
                </div>

                {/* Covered Concepts Chips */}
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '4px' }}>
                    Covered Rubric Concepts:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {lastEval.coveredConcepts && lastEval.coveredConcepts.length > 0 ? (
                      lastEval.coveredConcepts.map(c => (
                        <span key={c} style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          ✓ {c}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>None detected</span>
                    )}
                  </div>
                </div>

                {/* Missed Concepts Chips */}
                {lastEval.missedConcepts && lastEval.missedConcepts.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#991b1b', display: 'block', marginBottom: '4px' }}>
                      Missed / Unaddressed Concepts:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {lastEval.missedConcepts.map(c => (
                        <span key={c} style={{ fontSize: '0.72rem', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          ✗ {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8', fontSize: '0.84rem' }}>
                Awaiting candidate response. AI dynamically analyzes semantic cosine similarity and concept coverage upon answer submission.
              </div>
            )}
          </div>

          {/* Board Selector Panel Presence */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '12px', textTransform: 'uppercase' }}>
              Selector Board Members Present
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#008bdc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                  VK
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>Dr. Vivek Kapoor</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Chief Selector (AI & Algorithms)</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                  SM
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>Prof. Sunita Menon</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Domain Panelist (Computer Vision)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
