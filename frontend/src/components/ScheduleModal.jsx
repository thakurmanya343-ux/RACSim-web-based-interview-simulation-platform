import React, { useState } from 'react';
import { Calendar, Clock, X, Check, AlertCircle, Video } from 'lucide-react';

export default function ScheduleModal({ application, onClose, onConfirmSchedule }) {
  // Default to tomorrow 10:00 AM
  const getTomorrowTimeStr = (hours = 10, minutes = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hours, minutes, 0, 0);
    // Format YYYY-MM-DDTHH:mm
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [scheduledDateTime, setScheduledDateTime] = useState(
    application.scheduledAt
      ? new Date(new Date(application.scheduledAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : getTomorrowTimeStr(10, 0)
  );

  const [simulationTrack, setSimulationTrack] = useState('Multi-Stage Simulation (Technical + Adaptive QA)');
  const [panelRoom, setPanelRoom] = useState('Simulation Board Room #02');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePreset = (daysAhead, hours, mins) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hours, mins, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    setScheduledDateTime(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!scheduledDateTime) return;
    setIsSubmitting(true);
    await onConfirmSchedule(application.id, new Date(scheduledDateTime).toISOString());
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#e0f2fe', padding: '8px', borderRadius: '10px', color: '#008bdc' }}>
              <Calendar size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Schedule Interview Simulation
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Assign board interview slot for candidate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Candidate & Post summary */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
              {application.candidateName}
            </span>
            <span className="badge badge-blue">
              Match Score: {application.matchScore}%
            </span>
          </div>
          <div style={{ fontSize: '0.84rem', color: '#475569' }}>
            Post: <strong>{application.vacancyTitle}</strong>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
            Candidate Email: {application.candidateEmail}
          </div>
        </div>

        {/* Schedule Form */}
        <form onSubmit={handleConfirm}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Pick Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.95rem',
                outline: 'none',
                fontWeight: 600
              }}
            />
          </div>

          {/* Quick preset chips */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Quick Slot Presets:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handlePreset(1, 10, 0)}
                style={{ fontSize: '0.78rem' }}
              >
                Tomorrow 10:00 AM
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handlePreset(1, 14, 30)}
                style={{ fontSize: '0.78rem' }}
              >
                Tomorrow 2:30 PM
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handlePreset(2, 11, 0)}
                style={{ fontSize: '0.78rem' }}
              >
                In 2 Days 11:00 AM
              </button>
            </div>
          </div>

          {/* Simulation Format & Room */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Board Room
              </label>
              <select
                value={panelRoom}
                onChange={(e) => setPanelRoom(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              >
                <option value="Simulation Board Room #01">Board Room #01 (Executive)</option>
                <option value="Simulation Board Room #02">Board Room #02 (Technical)</option>
                <option value="Simulation Board Room #03">Board Room #03 (Adaptive)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Simulation Track
              </label>
              <select
                value={simulationTrack}
                onChange={(e) => setSimulationTrack(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
              >
                <option value="Standard Technical">Standard Technical</option>
                <option value="Adaptive Multi-Stage">Adaptive Multi-Stage</option>
                <option value="Leadership & Domain">Leadership & Domain</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <Check size={16} />
              {isSubmitting ? 'Scheduling...' : 'Confirm Interview Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
