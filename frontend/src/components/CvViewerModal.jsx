import React from 'react';
import { X, FileText, Download, ExternalLink, User, Mail, Tag, Award } from 'lucide-react';

export default function CvViewerModal({ application, onClose }) {
  if (!application) return null;

  const cvUrl = application.cvFileRef || '';
  const isPdf = cvUrl.toLowerCase().endsWith('.pdf');
  const fileName = application.originalFileName || application.cvFileRef?.split('/').pop() || 'Candidate_CV';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '860px', width: '92%', height: '88vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#e0f2fe', padding: '8px', borderRadius: '8px', color: '#008bdc' }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Candidate CV Dossier: {application.candidateName}
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '10px', marginTop: '2px' }}>
                <span>File: <strong>{fileName}</strong></span>
                <span>•</span>
                <span>Applied For: <strong>{application.vacancyTitle}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {cvUrl && (
              <a
                href={cvUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-sm"
                title="Open in new browser tab"
              >
                <ExternalLink size={14} /> Open in Tab
              </a>
            )}
            <button
              onClick={onClose}
              style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Candidate metadata strip */}
        <div style={{ padding: '12px 24px', background: '#f0f7fe', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.84rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155' }}>
              <Mail size={14} color="#008bdc" /> {application.candidateEmail}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155' }}>
              <Award size={14} color="#10b981" /> AI Match: <strong>{application.matchScore}%</strong>
            </span>
          </div>

          {/* Candidate skills preview */}
          {application.candidateSkills && application.candidateSkills.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {application.candidateSkills.slice(0, 5).map(sk => (
                <span
                  key={sk}
                  style={{
                    fontSize: '0.72rem',
                    background: '#ffffff',
                    border: '1px solid #bfdbfe',
                    color: '#0369a1',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}
                >
                  {sk}
                </span>
              ))}
              {application.candidateSkills.length > 5 && (
                <span style={{ fontSize: '0.72rem', color: '#64748b', alignSelf: 'center' }}>
                  +{application.candidateSkills.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Viewer Body */}
        <div style={{ flex: 1, backgroundColor: '#525659', overflow: 'hidden', position: 'relative' }}>
          {isPdf && cvUrl ? (
            <iframe
              src={cvUrl}
              title={`CV of ${application.candidateName}`}
              style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
            />
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                padding: '30px',
                textAlign: 'center'
              }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#008bdc', marginBottom: '16px' }}>
                <FileText size={32} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                {fileName}
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '440px', marginBottom: '20px' }}>
                This CV document (DOCX/Binary format) has been analyzed and parsed into the candidate's skill profile. You can download or view the document file directly.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <a
                  href={cvUrl}
                  download={fileName}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px' }}
                >
                  <Download size={16} /> Download CV Document
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
