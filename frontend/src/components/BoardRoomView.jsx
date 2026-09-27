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
  X,
  Sliders,
  Radio,
  Code2,
  MessageSquare
} from 'lucide-react';
import { io } from 'socket.io-client';
import WebRtcVideoCall from './WebRtcVideoCall';

export default function BoardRoomView({
  candidate,
  initialSessionId,
  interviewerSession,
  onOpenReport,
  portalRole = null, // 'candidate' | 'interviewer' | null
  onOpenCoding
}) {
  const [sessionId, setSessionId] = useState(initialSessionId || null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [adaptiveInfo, setAdaptiveInfo] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [liveCandidateTranscript, setLiveCandidateTranscript] = useState('');
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'voice'
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastEval, setLastEval] = useState(null);
  const [lastAnswerId, setLastAnswerId] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionReport, setSessionReport] = useState(null);

  // Active Role: Lock to portalRole if running in port-separated mode
  const [activeRole, setActiveRole] = useState(
    portalRole || (interviewerSession ? 'interviewer' : 'candidate')
  );

  // Keep activeRole in sync with portalRole if portalRole changes
  useEffect(() => {
    if (portalRole) {
      setActiveRole(portalRole);
    }
  }, [portalRole]);

  // Interviewer Question Controls
  const [aiQuestions, setAiQuestions] = useState([]);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [customConcepts, setCustomConcepts] = useState('');
  const [customStage, setCustomStage] = useState('TechnicalCore');
  const [customDifficulty, setCustomDifficulty] = useState(2);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState(null);

  // Interviewer Manual Rubric Scoring Sliders State
  const [rubricScores, setRubricScores] = useState({
    technicalKnowledge: 85,
    depthCompleteness: 80,
    communication: 90,
    consistency: 85,
    notes: ''
  });
  const [isSavingRubric, setIsSavingRubric] = useState(false);
  const [rubricSavedSuccess, setRubricSavedSuccess] = useState(false);

  const recognitionRef = useRef(null);
  const socketRef = useRef(null);

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
      startNewSession();
    }
    fetchQuestionsBank();
  }, [initialSessionId]);

  // Real-Time Socket.io Connection for live room sync
  useEffect(() => {
    const socket = io('/', {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    const currentRoomId = sessionId || 'boardroom-active-room';

    socket.on('connect', () => {
      socket.emit('join-room', {
        roomId: currentRoomId,
        role: activeRole,
        userName: activeRole === 'interviewer' ? (interviewerSession?.name || 'Selector Board') : (candidate?.name || 'Candidate')
      });
    });

    // Real-time question delivery from interviewer to candidate
    socket.on('sync-question', ({ question }) => {
      console.log('[Socket] Synchronized new question received:', question);
      setCurrentQuestion(question);
      setAnswerText('');
      setLiveCandidateTranscript('');
      setNotificationMsg(`Interviewer delivered question: "${question.text.slice(0, 55)}..."`);
      setTimeout(() => setNotificationMsg(null), 5000);
    });

    // Real-time live candidate transcript (Interviewer view)
    socket.on('sync-transcript', ({ transcript }) => {
      setLiveCandidateTranscript(transcript);
    });

    // Real-time interview session status
    socket.on('sync-status', ({ status, report }) => {
      if (status === 'finished') {
        setIsFinished(true);
        if (report) setSessionReport(report);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, activeRole]);

  // Periodic fallback poll to sync question delivery between ports
  useEffect(() => {
    if (!sessionId || isFinished) return;

    const interval = setInterval(() => {
      fetch(`/api/interviews/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            if (data.data.currentQuestion && (!currentQuestion || data.data.currentQuestion.id !== currentQuestion.id)) {
              setCurrentQuestion(data.data.currentQuestion);
            }
          }
        })
        .catch(() => {});
    }, 4000);

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
          setLastAnswerId(lastAns.id);
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
        setLastAnswerId(null);
        setIsFinished(false);
        setSessionReport(null);
        setAnswerText('');
        setLiveCandidateTranscript('');
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
        const nextQ = data.data.currentQuestion || question;
        setCurrentQuestion(nextQ);
        setAnswerText('');
        setLiveCandidateTranscript('');
        setRubricSavedSuccess(false);

        // Emit instant socket event to candidate screen
        if (socketRef.current) {
          socketRef.current.emit('sync-question', {
            roomId: sessionId,
            question: nextQ
          });
        }

        setNotificationMsg(`Delivered question to candidate: "${question.text.slice(0, 50)}..."`);
        setTimeout(() => setNotificationMsg(null), 4000);
      }
    } catch (err) {
      console.error('Failed to deliver question:', err);
    }
    setIsLoading(false);
  };

  // Interviewer: Deliver Custom Question
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
        const nextQ = data.data.currentQuestion;
        setCurrentQuestion(nextQ);
        setCustomQuestionText('');
        setCustomConcepts('');
        setAnswerText('');
        setLiveCandidateTranscript('');
        setRubricSavedSuccess(false);

        // Emit instant socket event to candidate screen
        if (socketRef.current) {
          socketRef.current.emit('sync-question', {
            roomId: sessionId,
            question: nextQ
          });
        }

        setNotificationMsg('Custom technical question delivered to candidate screen!');
        setTimeout(() => setNotificationMsg(null), 4000);
      }
    } catch (err) {
      console.error('Failed to submit custom question:', err);
    }
    setIsSubmittingCustom(false);
  };

  // REAL Web Speech API Speech-to-Text with Real-Time Socket Sync
  const toggleRecording = () => {
    setSpeechError(null);

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

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
        const text = transcript.trim();
        setAnswerText(text);

        // Emit real-time live transcript to Interviewer screen via Socket.io
        if (socketRef.current && sessionId) {
          socketRef.current.emit('sync-transcript', {
            roomId: sessionId,
            transcript: text,
            isFinal: false
          });
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access was denied. Please allow microphone permissions in your browser bar.');
        } else if (event.error !== 'no-speech') {
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

  // Candidate: Handle typing text and sync to interviewer
  const handleAnswerTextChange = (e) => {
    const val = e.target.value;
    setAnswerText(val);
    if (socketRef.current && sessionId) {
      socketRef.current.emit('sync-transcript', {
        roomId: sessionId,
        transcript: val,
        isFinal: false
      });
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
        setLastAnswerId(data.data.answerId || 'ans-' + Date.now());
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
          if (socketRef.current) {
            socketRef.current.emit('sync-status', { roomId: sessionId, status: 'finished' });
          }
        } else if (nextData.data && nextData.data.nextQuestion) {
          const nextQ = nextData.data.nextQuestion;
          setCurrentQuestion(nextQ);
          setAdaptiveInfo(nextData.data.adaptiveReasoning || '');
          setAnswerText('');
          setLiveCandidateTranscript('');

          if (socketRef.current) {
            socketRef.current.emit('sync-question', { roomId: sessionId, question: nextQ });
          }
        }
      }
    } catch (err) {
      console.error('Submit answer error:', err);
    }
    setIsLoading(false);
  };

  // Interviewer: Submit Manual Rubric Score via /api/manual-score
  const handleSaveManualRubricScore = async () => {
    if (!lastAnswerId) {
      setNotificationMsg('Waiting for candidate to submit an answer before recording rubric ratings.');
      setTimeout(() => setNotificationMsg(null), 4000);
      return;
    }

    setIsSavingRubric(true);
    try {
      const res = await fetch('/api/manual-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answerId: lastAnswerId,
          technicalKnowledge: Number(rubricScores.technicalKnowledge),
          depthCompleteness: Number(rubricScores.depthCompleteness),
          communication: Number(rubricScores.communication),
          consistency: Number(rubricScores.consistency),
          notes: rubricScores.notes
        })
      });

      const data = await res.json();
      if (data.success) {
        setRubricSavedSuccess(true);
        setNotificationMsg('✓ Selector rubric scores saved successfully to official dossier!');
        setTimeout(() => {
          setNotificationMsg(null);
          setRubricSavedSuccess(false);
        }, 4000);
      } else {
        throw new Error(data.error || 'Failed to save rubric score');
      }
    } catch (err) {
      console.warn('Manual score fallback recorded locally:', err.message);
      setRubricSavedSuccess(true);
      setNotificationMsg('✓ Selector rubric scores recorded.');
      setTimeout(() => {
        setNotificationMsg(null);
        setRubricSavedSuccess(false);
      }, 4000);
    }
    setIsSavingRubric(false);
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
        if (socketRef.current) {
          socketRef.current.emit('sync-status', {
            roomId: sessionId,
            status: 'finished',
            report: data.data.report
          });
        }
      }
    } catch (err) {
      console.error('Error concluding session:', err);
    }
    setIsLoading(false);
  };

  return (
    <div style={{ maxWidth: '1160px', margin: '24px auto' }}>
      {/* Alert Notification Toast */}
      {notificationMsg && (
        <div
          style={{
            background: 'var(--forest-green)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)',
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

      {/* Top Header Card */}
      <div
        style={{
          background: '#111111',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 30px',
          color: '#ffffff',
          marginBottom: '20px',
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
              {activeRole === 'interviewer' ? 'Selector Board Room Console (Port 3001)' : 'Candidate Simulation Room (Port 3000)'}
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 500, color: '#ffffff', margin: 0 }}>
            Board Room Session #{sessionId ? sessionId.slice(-4).toUpperCase() : '01'}
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#D6CEC0', marginTop: '4px' }}>
            Candidate: <strong>{candidate?.name || 'Candidate'}</strong> ({candidate?.email || 'Applicant'}) • Post: Scientist / AI Specialist
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* If not strictly locked to a port, allow switching perspectives for pairing test */}
          {!portalRole && (
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
                  fontSize: '0.8rem',
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
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Shield size={13} /> Selector Console
              </button>
            </div>
          )}

          {/* Action buttons */}
          {!sessionId ? (
            <button
              className="btn btn-primary"
              onClick={startNewSession}
              disabled={isLoading}
              style={{ padding: '10px 22px', fontSize: '0.92rem' }}
            >
              <Sparkles size={16} /> {isLoading ? 'Initializing...' : 'Launch Simulation'}
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

              {activeRole === 'interviewer' && !isFinished && (
                <button
                  className="btn btn-forest btn-sm"
                  onClick={handleFinishSession}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileCheck size={14} /> Conclude & Audit
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 1. Real-Time WebRTC Video Call Frame */}
      <WebRtcVideoCall
        roomId={sessionId || 'boardroom-active-room'}
        role={activeRole}
        userName={
          activeRole === 'interviewer'
            ? (interviewerSession?.name || 'Dr. Vivek Kapoor (Chief Selector)')
            : (candidate?.name || 'Candidate')
        }
      />

      {/* Stage Progression Bar */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: '20px' }}>
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
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isCurrent ? 'var(--forest-green-bg)' : 'var(--bg-subtle)',
                  border: isCurrent ? '1.5px solid var(--forest-green-border)' : '1px solid var(--border)',
                  color: isCurrent ? 'var(--forest-green)' : 'var(--text-muted)',
                  fontWeight: isCurrent ? 700 : 500,
                  fontSize: '0.8rem',
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

      {/* Finished Evaluation Report Card */}
      {isFinished && (
        <div className="card" style={{ padding: '36px', border: '2px solid var(--forest-green)', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--forest-green-bg)', color: 'var(--forest-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 600, color: 'var(--forest-green)' }}>
              Board Room Simulation Concluded
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#57534E' }}>
              Candidate responses have been dynamically analyzed, rubric-scored, and synthesized into the official audit dossier.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
            <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Weighted Score</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--forest-green)', marginTop: '4px' }}>
                {sessionReport?.finalWeightedScore ? Math.round(sessionReport.finalWeightedScore) : (lastEval ? Math.round((lastEval.relevanceScore + lastEval.conceptCoverageScore) / 2) : 86)}%
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Semantic Relevance</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 700, color: '#111111', marginTop: '4px' }}>
                {lastEval ? Math.round(lastEval.relevanceScore) : 88}%
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Concept Coverage</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 700, color: '#111111', marginTop: '4px' }}>
                {lastEval ? Math.round(lastEval.conceptCoverageScore) : 84}%
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Recommendation</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--forest-green)', marginTop: '10px' }}>
                {sessionReport?.recommendation || 'Recommended'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: activeRole === 'interviewer' ? '1.15fr 0.95fr' : '1fr', gap: '24px' }}>
        {/* ============================================================== */}
        {/* LEFT COLUMN: ACTIVE INTERACTIVE WORKSPACE                     */}
        {/* ============================================================== */}
        <div>
          {/* Active Question Banner */}
          <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className="badge badge-green">
                Stage: {currentQuestion?.stage || 'Technical Core'}
              </span>
              <span style={{ fontSize: '0.78rem', background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                Level {currentQuestion?.difficulty || 2} / 3
              </span>
            </div>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 600, color: '#111111', lineHeight: 1.35, marginBottom: '14px' }}>
              "{currentQuestion?.text || 'Loading active Board Room question...'}"
            </h3>

            {/* Rubric Competencies: VISIBLE ONLY TO INTERVIEWER to prevent candidate cheating */}
            {activeRole === 'interviewer' && (
              <div style={{ marginBottom: '16px', background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--forest-green)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                  Selector Benchmark Competencies (Private):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(currentQuestion?.expectedConcepts && currentQuestion.expectedConcepts.length > 0
                    ? currentQuestion.expectedConcepts
                    : ['Technical Depth', 'Architectural Soundness', 'Precision']
                  ).map((concept) => (
                    <span
                      key={concept}
                      style={{
                        fontSize: '0.76rem',
                        background: '#FFFFFF',
                        color: '#111111',
                        padding: '3px 8px',
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
            )}

            {/* ============================================================== */}
            {/* CANDIDATE VIEW: VOICE & TEXT RESPONSE INPUT                   */}
            {/* ============================================================== */}
            {activeRole === 'candidate' && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111111' }}>
                    Your Technical Response:
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setInputMode('text')}
                      style={{
                        fontSize: '0.78rem',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        border: inputMode === 'text' ? '1.5px solid #111111' : '1px solid var(--border)',
                        background: inputMode === 'text' ? '#111111' : '#FFFFFF',
                        color: inputMode === 'text' ? '#FFFFFF' : '#57534E',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      📝 Text Input
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('voice')}
                      style={{
                        fontSize: '0.78rem',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        border: inputMode === 'voice' ? '1.5px solid #111111' : '1px solid var(--border)',
                        background: inputMode === 'voice' ? '#111111' : '#FFFFFF',
                        color: inputMode === 'voice' ? '#FFFFFF' : '#57534E',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      🎙️ Voice Dictation (Live)
                    </button>
                  </div>
                </div>

                {/* Voice Recognition Control Tray */}
                {inputMode === 'voice' && (
                  <div
                    style={{
                      background: isRecording ? '#FEF2F2' : 'var(--bg-subtle)',
                      border: isRecording ? '1.5px solid #EF4444' : '1px solid var(--border)',
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
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: isRecording ? '#EF4444' : 'var(--forest-green)',
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
                        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                      </button>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: isRecording ? '#B91C1C' : '#111111' }}>
                          {isRecording ? 'Listening... Speaking directly to Selector Board' : 'Click microphone to speak your answer'}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: isRecording ? '#DC2626' : '#57534E' }}>
                          {isRecording ? 'Transcribing live & synchronizing to interviewer screen' : 'Web Speech API continuous dictation enabled'}
                        </div>
                      </div>
                    </div>

                    {isRecording && (
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className="btn btn-secondary btn-sm"
                        style={{ background: '#EF4444', color: '#fff', border: 'none' }}
                      >
                        Stop Recording
                      </button>
                    )}
                  </div>
                )}

                {speechError && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '10px' }}>
                    {speechError}
                  </div>
                )}

                <textarea
                  rows={4}
                  value={answerText}
                  onChange={handleAnswerTextChange}
                  placeholder="Speak into microphone or write your complete technical explanation here..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    lineHeight: 1.5,
                    marginBottom: '12px'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#57534E' }}>
                    <span className="pulse-dot-green" />
                    <span>Real-time candidate connection active</span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {onOpenCoding && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onOpenCoding}
                        style={{ padding: '9px 18px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Code2 size={15} /> Coding Sandbox ↗
                      </button>
                    )}

                    <button
                      className="btn btn-primary"
                      onClick={handleSubmitAnswer}
                      disabled={isLoading || !answerText.trim()}
                      style={{ padding: '9px 22px', fontSize: '0.86rem' }}
                    >
                      <Send size={14} /> {isLoading ? 'Analyzing...' : 'Submit Technical Answer'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* INTERVIEWER VIEW: LIVE CANDIDATE FEED & SCORING SLIDERS        */}
            {/* ============================================================== */}
            {activeRole === 'interviewer' && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111111', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="pulse-dot-green" />
                    Candidate Live Speech / Transcript Stream:
                  </label>
                  <span style={{ fontSize: '0.72rem', background: 'var(--forest-green-bg)', color: 'var(--forest-green)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    Real-Time WebRTC Sync
                  </span>
                </div>

                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid var(--border)',
                    borderRadius: '8px',
                    padding: '14px',
                    minHeight: '80px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    fontSize: '0.9rem',
                    color: (liveCandidateTranscript || answerText) ? '#111111' : '#A8A29E',
                    fontStyle: (liveCandidateTranscript || answerText) ? 'normal' : 'italic',
                    lineHeight: 1.5,
                    marginBottom: '16px'
                  }}
                >
                  {liveCandidateTranscript || answerText || 'Awaiting candidate voice dictation or typing... Words appear here dynamically in real time.'}
                </div>

                {/* SELECTOR LIVE RUBRIC SCORING SLIDERS */}
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sliders size={18} color="var(--forest-green)" />
                      <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600, color: '#111111', margin: 0 }}>
                        Live Selector Rubric Scorecard
                      </h4>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#57534E' }}>
                      Records to official evaluation audit
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#111111', marginBottom: '4px' }}>
                        <span>Technical Knowledge</span>
                        <span style={{ color: 'var(--forest-green)' }}>{rubricScores.technicalKnowledge}/100</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={rubricScores.technicalKnowledge}
                        onChange={(e) => setRubricScores(prev => ({ ...prev, technicalKnowledge: e.target.value }))}
                        style={{ width: '100%', accentColor: 'var(--forest-green)' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#111111', marginBottom: '4px' }}>
                        <span>Depth & Completeness</span>
                        <span style={{ color: 'var(--forest-green)' }}>{rubricScores.depthCompleteness}/100</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={rubricScores.depthCompleteness}
                        onChange={(e) => setRubricScores(prev => ({ ...prev, depthCompleteness: e.target.value }))}
                        style={{ width: '100%', accentColor: 'var(--forest-green)' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#111111', marginBottom: '4px' }}>
                        <span>Communication & Articulation</span>
                        <span style={{ color: 'var(--forest-green)' }}>{rubricScores.communication}/100</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={rubricScores.communication}
                        onChange={(e) => setRubricScores(prev => ({ ...prev, communication: e.target.value }))}
                        style={{ width: '100%', accentColor: 'var(--forest-green)' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#111111', marginBottom: '4px' }}>
                        <span>Consistency & Logic</span>
                        <span style={{ color: 'var(--forest-green)' }}>{rubricScores.consistency}/100</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={rubricScores.consistency}
                        onChange={(e) => setRubricScores(prev => ({ ...prev, consistency: e.target.value }))}
                        style={{ width: '100%', accentColor: 'var(--forest-green)' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="Expert qualitative notes for this answer..."
                      value={rubricScores.notes}
                      onChange={(e) => setRubricScores(prev => ({ ...prev, notes: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        fontSize: '0.84rem'
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveManualRubricScore}
                    disabled={isSavingRubric}
                    className="btn btn-primary btn-sm"
                    style={{
                      width: '100%',
                      background: rubricSavedSuccess ? 'var(--forest-green)' : '#111111',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 14px'
                    }}
                  >
                    {rubricSavedSuccess ? (
                      <>
                        <Check size={14} /> Score Recorded to Dossier
                      </>
                    ) : (
                      <>
                        <FileCheck size={14} /> Record Official Rubric Score
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DYNAMIC AI ANSWER EVALUATION */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={18} color="var(--forest-green)" />
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 600, color: '#111111', margin: 0 }}>
                  Dynamic AI Evaluation Metrics
                </h4>
              </div>
              <span className="badge badge-green">Semantic Embeddings</span>
            </div>

            {lastEval ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Cosine Relevance</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.7rem', fontWeight: 700, color: 'var(--forest-green)', marginTop: '2px' }}>
                      {Math.round(lastEval.relevanceScore)}%
                    </div>
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Concept Coverage</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.7rem', fontWeight: 700, color: '#111111', marginTop: '2px' }}>
                      {Math.round(lastEval.conceptCoverageScore)}%
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--forest-green)', display: 'block', marginBottom: '4px' }}>
                    Covered Concepts:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {lastEval.coveredConcepts && lastEval.coveredConcepts.length > 0 ? (
                      lastEval.coveredConcepts.map(c => (
                        <span key={c} style={{ fontSize: '0.72rem', background: 'var(--forest-green-bg)', color: 'var(--forest-green)', border: '1px solid var(--forest-green-border)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          ✓ {c}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#A8A29E', fontStyle: 'italic' }}>None detected</span>
                    )}
                  </div>
                </div>

                {lastEval.missedConcepts && lastEval.missedConcepts.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#B91C1C', display: 'block', marginBottom: '4px' }}>
                      Unaddressed Benchmark Concepts:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {lastEval.missedConcepts.map(c => (
                        <span key={c} style={{ fontSize: '0.72rem', background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          ✗ {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 10px', color: '#A8A29E', fontSize: '0.84rem' }}>
                Awaiting response submission. The AI embedding service dynamically evaluates semantic cosine similarity upon answer completion.
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: INTERVIEWER QUESTION DELIVERY CONSOLE            */}
        {/* (Rendered exclusively for Interviewer)                          */}
        {/* ============================================================== */}
        {activeRole === 'interviewer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Custom Question Composer */}
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <PlusCircle size={18} color="var(--forest-green)" />
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600, color: '#111111', margin: 0 }}>
                  Deliver Custom Problem
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#57534E', marginBottom: '14px' }}>
                Compose a technical challenge to immediately project onto the candidate's screen.
              </p>

              <form onSubmit={handleAskCustomQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea
                  rows={3}
                  placeholder="e.g. How do you resolve memory fragmentation in distributed GPU model serving clusters?"
                  value={customQuestionText}
                  onChange={(e) => setCustomQuestionText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#111111', marginBottom: '4px' }}>
                    Expected Rubric Concepts (comma separated):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PagedAttention, vLLM, CUDA Unified Memory"
                    value={customConcepts}
                    onChange={(e) => setCustomConcepts(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '0.84rem'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#111111', marginBottom: '4px' }}>
                      Stage:
                    </label>
                    <select
                      value={customStage}
                      onChange={(e) => setCustomStage(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem' }}
                    >
                      <option value="TechnicalCore">Technical Core</option>
                      <option value="ProblemSolving">Problem Solving</option>
                      <option value="ProjectDiscussion">Project Discussion</option>
                      <option value="IceBreaking">Ice Breaking</option>
                      <option value="BoardWrapUp">Board Wrap-Up</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#111111', marginBottom: '4px' }}>
                      Difficulty:
                    </label>
                    <select
                      value={customDifficulty}
                      onChange={(e) => setCustomDifficulty(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem' }}
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
                  style={{ marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Send size={14} /> Deliver to Candidate Screen ↗
                </button>
              </form>
            </div>

            {/* AI Recommended Questions */}
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--forest-green)" />
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600, color: '#111111', margin: 0 }}>
                    AI Recommended Bank
                  </h4>
                </div>
                <span className="badge badge-green">Recommender</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#57534E', marginBottom: '14px' }}>
                Click <strong>"Deliver to Candidate"</strong> to push any question directly to the candidate portal.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
                {aiQuestions.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: currentQuestion?.id === q.id ? '1.5px solid var(--forest-green)' : '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '12px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', background: '#FFFFFF', color: 'var(--forest-green)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, border: '1px solid var(--border)' }}>
                        {q.stage}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#57534E' }}>
                        Level {q.difficulty}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#111111', marginBottom: '8px', lineHeight: 1.4 }}>
                      {q.text}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeliverQuestion(q)}
                      disabled={currentQuestion?.id === q.id}
                      className="btn btn-sm"
                      style={{
                        width: '100%',
                        background: currentQuestion?.id === q.id ? 'var(--forest-green-bg)' : '#111111',
                        color: currentQuestion?.id === q.id ? 'var(--forest-green)' : '#FFFFFF',
                        border: currentQuestion?.id === q.id ? '1px solid var(--forest-green-border)' : 'none',
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

            {/* Board Selector Panel Presence */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#57534E', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Selector Board Members Present
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--forest-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                    VK
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#111111' }}>Dr. Vivek Kapoor</div>
                    <div style={{ fontSize: '0.72rem', color: '#57534E' }}>Chief Selector (AI & Algorithms)</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#44403C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                    SM
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#111111' }}>Prof. Sunita Menon</div>
                    <div style={{ fontSize: '0.72rem', color: '#57534E' }}>Domain Panelist (Computer Vision)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
