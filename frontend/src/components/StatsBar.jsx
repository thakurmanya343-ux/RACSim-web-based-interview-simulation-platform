import React from 'react';
import { Briefcase, Users, Target, Award } from 'lucide-react';

export default function StatsBar() {
  return (
    <section className="stats-bar">
      <div className="container stats-bar-inner">
        <div className="stat-item">
          <Briefcase className="stat-icon" />
          <div className="stat-text">
            <span>1,250+</span> Open Vacancies
          </div>
        </div>

        <div className="stats-divider" />

        <div className="stat-item">
          <Users className="stat-icon" />
          <div className="stat-text">
            <span>4,800+</span> Candidates Matched
          </div>
        </div>

        <div className="stats-divider" />

        <div className="stat-item">
          <Target className="stat-icon" />
          <div className="stat-text">
            <span>98.4%</span> Skill Match Precision
          </div>
        </div>

        <div className="stats-divider" />

        <div className="stat-item">
          <Award className="stat-icon" />
          <div className="stat-text">
            <span>450+</span> Certified Panel Selectors
          </div>
        </div>
      </div>
    </section>
  );
}
