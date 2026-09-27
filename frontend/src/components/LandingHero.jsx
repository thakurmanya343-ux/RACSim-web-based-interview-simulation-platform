import React, { useRef, useState } from 'react';
import { UploadCloud, FileCheck, ArrowRight, ShieldCheck, Sparkles, Check, FileText } from 'lucide-react';

export default function LandingHero({ onFileUpload, onGoToInterviewer }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-grid">
          {/* Left Column: Headline + Value Highlights + Interviewer Link */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#e0f2fe',
                padding: '6px 14px',
                borderRadius: '999px',
                marginBottom: '16px'
              }}
            >
              <Sparkles size={16} color="#008bdc" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AI-Powered Selection Board
              </span>
            </div>

            <h1 className="hero-headline">
              Find the right role. <br />
              <span>Get evaluated fairly.</span>
            </h1>

            <p className="hero-subheadline">
              Step into an objective recruitment simulation where your real technical expertise is
              automatically parsed, matched using cosine semantic similarity, and presented
              directly to expert selector boards.
            </p>

            {/* Feature Points */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#008bdc', flexShrink: 0 }}>
                  <Check size={16} />
                </div>
                <span style={{ fontSize: '0.94rem', color: '#334155', fontWeight: 500 }}>
                  <strong>Dynamic CV Parsing</strong> — Extracts verified skills matched against 55+ taxonomy items
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                  <Check size={16} />
                </div>
                <span style={{ fontSize: '0.94rem', color: '#334155', fontWeight: 500 }}>
                  <strong>Cosine Semantic Alignment</strong> — Objective ranking across public & private vacancies
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                  <Check size={16} />
                </div>
                <span style={{ fontSize: '0.94rem', color: '#334155', fontWeight: 500 }}>
                  <strong>Adaptive Board Room</strong> — Multi-stage simulation with live speech answering & dynamic AI scoring
                </span>
              </div>
            </div>

            {/* Interviewer Selector Login Route */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={18} color="#10b981" />
                <span style={{ fontSize: '0.86rem', color: '#475569', fontWeight: 600 }}>
                  Verified Evaluator Panels
                </span>
              </div>
              <a
                className="interviewer-route-link"
                onClick={(e) => {
                  e.preventDefault();
                  onGoToInterviewer();
                }}
                style={{ cursor: 'pointer' }}
              >
                Interviewer / Selector Login →
              </a>
            </div>
          </div>

          {/* Right Column: Bordered Candidate Action Card (Internshala Modelled) */}
          <div>
            <div className="candidate-hero-card" style={{ marginBottom: 0 }}>
              <div className="candidate-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: '#e0f2fe', padding: '6px', borderRadius: '8px' }}>
                    <FileText size={18} color="#008bdc" />
                  </div>
                  <h3 className="candidate-card-title">Candidate — Get Started</h3>
                </div>
                <span className="badge badge-blue">Quick Matching</span>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
              />

              {/* Upload Dropzone */}
              <div
                className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon-circle">
                  <UploadCloud size={28} />
                </div>
                <div className="dropzone-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  Upload your CV / Resume
                </div>
                <div className="dropzone-hint" style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '16px' }}>
                  Supports PDF or DOCX (up to 15MB)
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', maxWidth: '280px', margin: '0 auto', padding: '12px 20px', fontSize: '0.96rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <UploadCloud size={18} />
                  Upload your CV
                </button>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  We'll match you to relevant openings automatically
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
