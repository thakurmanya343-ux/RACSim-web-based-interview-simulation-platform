import React, { useRef, useState } from 'react';
import { Upload, ArrowUpRight, ArrowRight, Zap } from 'lucide-react';

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
    <section className="hero-wrapper">
      {/* Rotated Vertical Editorial Watermark on Left Margin */}
      <div className="editorial-side-label">
        Edition 03 &nbsp;&nbsp;&nbsp;&nbsp; 2026 &nbsp;&nbsp;&nbsp;&nbsp; Vol. 01
      </div>

      <div className="container">
        <div className="hero-grid">
          {/* Left Column: Headline, Description & CTAs */}
          <div>
            {/* Tag above headline */}
            <div className="hero-tag">
              <span className="hero-tag-dot" />
              <span>AI-Powered Selection Board</span>
            </div>

            {/* Editorial Serif Headline matching the image */}
            <h1 className="hero-headline">
              Find the right role.<br />
              <em>Get evaluated</em><br />
              <em>fairly.</em>
            </h1>

            {/* Sub-headline text */}
            <p className="hero-subheadline">
              Step into an objective recruitment simulation where your real
              technical expertise is automatically parsed, matched using
              semantic similarity, and presented directly to expert selector
              boards.
            </p>

            {/* Action Row */}
            <div className="hero-actions-row">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
              />

              <button
                className="btn-upload-cv"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} />
                Upload your CV
              </button>

              <a
                className="interviewer-editorial-link"
                onClick={(e) => {
                  e.preventDefault();
                  onGoToInterviewer();
                }}
              >
                Interviewer login <ArrowUpRight size={15} />
              </a>
            </div>
          </div>

          {/* Right Column: "01 CANDIDATE — GET STARTED" Card */}
          <div>
            <div className="candidate-journal-card">
              {/* Card Header */}
              <div className="candidate-card-top-row">
                <div className="candidate-card-badge-left">
                  <span className="candidate-card-num">01</span>
                  <span className="candidate-card-sublabel">Candidate — Get Started</span>
                </div>
                <span className="pill-quick-match">Quick match</span>
              </div>

              {/* Upload Drop Area */}
              <div
                className={`journal-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-tray-circle">
                  <Upload size={22} />
                </div>
                <h3 className="dropzone-serif-title">
                  Drop your CV here
                </h3>
                <p className="dropzone-file-hint">
                  PDF or DOCX · up to 15MB
                </p>
              </div>

              {/* Bottom Alignment Status */}
              <div
                className="candidate-card-footer"
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload and analyze your profile"
              >
                <div className="card-match-indicator">
                  <span className="pulse-dot-green" />
                  <div>
                    <div className="match-status-title">Profile match found</div>
                    <div className="match-status-desc">92% alignment with 4 roles</div>
                  </div>
                </div>
                <ArrowRight size={18} className="card-footer-arrow" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Made in Bolt Badge (Bottom Right as seen in image) */}
      <div className="watermark-badge">
        <Zap size={13} fill="#111111" />
        <span>Made in Bolt</span>
      </div>
    </section>
  );
}
