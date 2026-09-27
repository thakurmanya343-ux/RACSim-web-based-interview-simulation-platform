import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowUpDown,
  Download,
  Eye,
  RefreshCw,
  Mic
} from 'lucide-react';
import ScheduleModal from './ScheduleModal';
import CvViewerModal from './CvViewerModal';

export default function InterviewerDashboard({
  applications,
  vacancies,
  onScheduleInterview,
  onEnterBoardRoom,
  interviewerSession,
  onRefresh
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVacancyFilter, setSelectedVacancyFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('score-desc');

  // Modals state
  const [schedulingApp, setSchedulingApp] = useState(null);
  const [viewingCvApp, setViewingCvApp] = useState(null);

  // Filter and sort applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      (app.candidateName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.candidateEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.vacancyTitle || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVacancy =
      selectedVacancyFilter === 'ALL' || app.vacancyId === selectedVacancyFilter;

    const matchesStatus =
      selectedStatusFilter === 'ALL' || app.status === selectedStatusFilter;

    return matchesSearch && matchesVacancy && matchesStatus;
  });

  filteredApps.sort((a, b) => {
    if (sortBy === 'score-desc') return (b.matchScore || 0) - (a.matchScore || 0);
    if (sortBy === 'score-asc') return (a.matchScore || 0) - (b.matchScore || 0);
    if (sortBy === 'date-desc') return new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0);
    return 0;
  });

  // Calculate statistics
  const totalApps = applications.length;
  const pendingCount = applications.filter((a) => a.status === 'Pending Schedule').length;
  const scheduledCount = applications.filter((a) => a.status === 'Interview Scheduled').length;
  const avgScore =
    totalApps > 0
      ? Math.round(applications.reduce((acc, a) => acc + (a.matchScore || 0), 0) / totalApps)
      : 0;

  const handleConfirmSchedule = async (appId, scheduledAt) => {
    await onScheduleInterview(appId, scheduledAt);
    setSchedulingApp(null);
  };

  return (
    <div style={{ maxWidth: '1160px', margin: '36px auto' }}>
      {/* Selector Welcome Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#111111',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="pulse-dot-green" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest-green-border)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Selector Board Session
            </span>
            <span style={{ fontSize: '0.82rem', color: '#A8A29E' }}>
              • {interviewerSession?.role || 'Panel Expert'}
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', fontWeight: 500, color: '#ffffff', margin: 0 }}>
            Welcome, {interviewerSession?.name || 'Chief Selector'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#D6CEC0', marginTop: '4px' }}>
            Simulate recruitment evaluations, inspect candidate CVs, and schedule interview sessions.
          </p>
        </div>

        <button
          className="btn btn-outline btn-sm"
          onClick={onRefresh}
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Total Applicants
            </span>
            <Users size={17} color="var(--forest-green)" />
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', fontWeight: 700, color: '#111111', marginTop: '6px' }}>
            {totalApps}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Across all 5 domain tracks
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
              Pending Schedule
            </span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', marginTop: '8px' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
            Awaiting slot confirmation
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
              Interviews Scheduled
            </span>
            <CheckCircle size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>
            {scheduledCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
            Ready for board room
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
              Avg. Match Score
            </span>
            <TrendingUp size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6', marginTop: '8px' }}>
            {avgScore}%
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
            AI embedding relevance
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search candidate name, email, or vacancy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              fontSize: '0.88rem'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Vacancy Filter */}
          <select
            value={selectedVacancyFilter}
            onChange={(e) => setSelectedVacancyFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              backgroundColor: '#fff'
            }}
          >
            <option value="ALL">All Vacancies</option>
            {vacancies.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              backgroundColor: '#fff'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending Schedule">Pending Schedule</option>
            <option value="Interview Scheduled">Interview Scheduled</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              backgroundColor: '#fff'
            }}
          >
            <option value="score-desc">Match Score: High to Low</option>
            <option value="score-asc">Match Score: Low to High</option>
            <option value="date-desc">Most Recent First</option>
          </select>
        </div>
      </div>

      {/* Applications Table / Cards */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Applied Vacancy</th>
              <th>Match Score</th>
              <th>Status & Slot</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApps.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  No applicant applications match your search criteria.
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => {
                const isScheduled = app.status === 'Interview Scheduled';
                const score = app.matchScore || 50;

                return (
                  <tr key={app.id}>
                    {/* Candidate Info */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#e0f2fe',
                            color: '#008bdc',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem'
                          }}
                        >
                          {(app.candidateName || 'C').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {app.candidateName}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {app.candidateEmail}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Applied Vacancy */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>
                        {app.vacancyTitle}
                      </div>
                      <span className="badge badge-blue" style={{ fontSize: '0.72rem', marginTop: '4px' }}>
                        {app.vacancyDomain}
                      </span>
                    </td>

                    {/* Match Score */}
                    <td style={{ minWidth: '150px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: score >= 75 ? '#059669' : '#008bdc' }}>
                          {score}%
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Cosine AI
                        </span>
                      </div>
                      <div className="progress-container">
                        <div
                          className={`progress-fill ${score >= 75 ? 'high' : score >= 45 ? 'mid' : 'low'}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </td>

                    {/* Status & Scheduled Datetime */}
                    <td>
                      {app.status === 'Accepted' ? (
                        <div>
                          <span
                            className="badge badge-green"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                          >
                            <CheckCircle size={12} />
                            Accepted by Candidate
                          </span>
                          {app.scheduledAt && (
                            <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '4px', fontWeight: 600 }}>
                              🕒 {new Date(app.scheduledAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                        </div>
                      ) : isScheduled ? (
                        <div>
                          <span
                            className="badge badge-blue"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Clock size={12} />
                            Interview Scheduled
                          </span>
                          {app.scheduledAt && (
                            <div style={{ fontSize: '0.78rem', color: '#0369a1', marginTop: '4px', fontWeight: 600 }}>
                              🕒 {new Date(app.scheduledAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          Pending Schedule
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setViewingCvApp(app)}
                          title="View uploaded CV"
                        >
                          <Eye size={14} /> View CV
                        </button>

                        {(isScheduled || app.status === 'Accepted') && (
                          <button
                            className="btn btn-sm"
                            style={{ background: '#059669', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => onEnterBoardRoom && onEnterBoardRoom(app)}
                            title="Join live Board Room simulation"
                          >
                            <Mic size={14} /> Enter Board Room
                          </button>
                        )}

                        <button
                          className={`btn btn-sm ${isScheduled ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => setSchedulingApp(app)}
                        >
                          <Calendar size={14} />
                          {isScheduled ? 'Reschedule' : 'Schedule Interview'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Schedule Interview Modal */}
      {schedulingApp && (
        <ScheduleModal
          application={schedulingApp}
          onClose={() => setSchedulingApp(null)}
          onConfirmSchedule={handleConfirmSchedule}
        />
      )}

      {/* View CV Modal */}
      {viewingCvApp && (
        <CvViewerModal
          application={viewingCvApp}
          onClose={() => setViewingCvApp(null)}
        />
      )}
    </div>
  );
}
