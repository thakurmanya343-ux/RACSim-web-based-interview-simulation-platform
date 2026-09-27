const PDFDocument = require('pdfkit');

/**
 * Builds an executive, printable PDF evaluation dossier for an interview.
 * Returns a readable stream that can be piped directly into Express response.
 */
function generateEvaluationPdf(reportData, stream) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  doc.pipe(stream);

  // Header Banner
  doc
    .rect(0, 0, doc.page.width, 70)
    .fill('#1e293b'); // Dark Slate

  doc
    .fillColor('#ffffff')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('RACSim | RECRUITMENT & ASSESSMENT PLATFORM', 40, 20);

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#94a3b8')
    .text('PSWB01 Interview Simulation Software — Board Room Assessment Dossier', 40, 44);

  doc.moveDown(3);

  // Candidate & Post Details Table
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#0f172a')
    .text('Candidate Assessment Summary', 40, 90);

  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, 110).lineTo(555, 110).stroke();

  doc.fontSize(10).font('Helvetica');

  const col1 = 40;
  const col2 = 300;
  let y = 120;

  doc.fillColor('#475569').text('Candidate Name:', col1, y);
  doc.fillColor('#0f172a').font('Helvetica-Bold').text(reportData.candidateName || 'Dr. Aarav Sharma', col1 + 100, y);

  doc.font('Helvetica').fillColor('#475569').text('Target Post:', col2, y);
  doc.fillColor('#0f172a').font('Helvetica-Bold').text(reportData.postTitle || 'Scientist B', col2 + 90, y);

  y += 18;
  doc.font('Helvetica').fillColor('#475569').text('Candidate ID:', col1, y);
  doc.fillColor('#0f172a').text(reportData.candidateId || 'N/A', col1 + 100, y);

  doc.fillColor('#475569').text('Report ID:', col2, y);
  doc.fillColor('#0f172a').text(reportData.id || `report-${reportData.candidateId}`, col2 + 90, y);

  y += 18;
  doc.fillColor('#475569').text('Generated Date:', col1, y);
  doc.fillColor('#0f172a').text(new Date().toLocaleDateString(), col1 + 100, y);

  doc.fillColor('#475569').text('Questions Evaluated:', col2, y);
  doc.fillColor('#0f172a').text(`${reportData.totalQuestionsAnswered || 0}`, col2 + 115, y);

  // Overall Score Badge
  y += 35;
  const finalScore = Number(reportData.finalWeightedScore || 0).toFixed(1);
  let statusText = 'RECOMMENDED';
  let badgeColor = '#059669'; // Emerald

  if (finalScore < 60) {
    statusText = 'NOT RECOMMENDED';
    badgeColor = '#dc2626'; // Red
  } else if (finalScore < 75) {
    statusText = 'CONDITIONALLY RECOMMENDED';
    badgeColor = '#d97706'; // Amber
  }

  doc.rect(40, y, 515, 55).fill('#f8fafc').strokeColor('#e2e8f0').stroke();

  doc
    .fillColor('#64748b')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('FINAL WEIGHTED SUITABILITY SCORE', 55, y + 12);

  doc
    .fillColor(badgeColor)
    .fontSize(22)
    .font('Helvetica-Bold')
    .text(`${finalScore}%`, 55, y + 26);

  doc
    .fillColor(badgeColor)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text(`VERDICT: ${statusText}`, 260, y + 22);

  // Rubric Breakdown Table
  y += 75;
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#0f172a')
    .text('Scoring Rubric Breakdown (Exact Configured Weights)', 40, y);

  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, y + 16).lineTo(555, y + 16).stroke();

  y += 24;
  const metrics = [
    { name: 'Question Relevance (AI Semantic)', weight: '10%', score: `${reportData.questionRelevanceAvg}%` },
    { name: 'Answer Relevance (AI Semantic)', weight: '25%', score: `${reportData.answerRelevanceAvg}%` },
    { name: 'Technical Knowledge (Expert Panel)', weight: '35%', score: `${reportData.technicalKnowledgeScore}%` },
    { name: 'Depth & Completeness (Expert Panel)', weight: '15%', score: `${reportData.depthScore}%` },
    { name: 'Communication Clarity (Expert Panel)', weight: '10%', score: `${reportData.communicationScore}%` },
    { name: 'Consistency & Alignment (Expert Panel)', weight: '5%', score: `${reportData.consistencyScore}%` },
  ];

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569');
  doc.text('EVALUATION DIMENSION', 45, y);
  doc.text('WEIGHT', 360, y);
  doc.text('SCORE', 480, y);

  y += 12;
  doc.strokeColor('#e2e8f0').moveTo(40, y).lineTo(555, y).stroke();
  y += 6;

  metrics.forEach((m, idx) => {
    const bgColor = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(40, y - 4, 515, 18).fill(bgColor);

    doc.font('Helvetica').fontSize(9).fillColor('#1e293b').text(m.name, 45, y);
    doc.font('Helvetica-Bold').fillColor('#64748b').text(m.weight, 365, y);
    doc.font('Helvetica-Bold').fillColor('#0f172a').text(m.score, 485, y);
    y += 18;
  });

  // Question-by-Question Evidence
  y += 20;
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#0f172a')
    .text('Question-by-Question Evidence & Expert Remarks', 40, y);

  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, y + 16).lineTo(555, y + 16).stroke();
  y += 24;

  const evidence = reportData.questionByQuestionEvidence || [];

  evidence.slice(0, 4).forEach((q, idx) => {
    if (y > 700) {
      doc.addPage();
      y = 40;
    }

    doc.rect(40, y, 515, 60).fill('#f1f5f9').strokeColor('#cbd5e1').stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#0284c7')
      .text(`[Q${idx + 1}] (${q.stage} - Diff ${q.difficulty})`, 48, y + 6);

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#0f172a')
      .text(q.questionText ? q.questionText.substring(0, 85) + '...' : '', 180, y + 6);

    const answerSnippet = q.answerText ? `"${q.answerText.substring(0, 95)}..."` : 'No answer provided.';
    doc
      .font('Helvetica-Oblique')
      .fontSize(8)
      .fillColor('#475569')
      .text(answerSnippet, 48, y + 20);

    const scoresLine = `AI Rel: ${q.aiRelevanceScore}% | Concept Coverage: ${q.aiConceptCoverageScore}% | Tech: ${q.manualScores?.technicalKnowledge || 0} | Notes: ${q.notes || 'None'}`;
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#059669')
      .text(scoresLine, 48, y + 36);

    y += 68;
  });

  // Footer & Sign-off Block
  if (y > 720) {
    doc.addPage();
    y = 50;
  } else {
    y = Math.max(y + 20, 720);
  }

  doc.strokeColor('#cbd5e1').moveTo(40, y).lineTo(555, y).stroke();
  y += 8;

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#94a3b8')
    .text('Certified by RACSim Autonomous Board Room Assessment Engine (PSWB01). Official Document.', 40, y);

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#475569')
    .text('PANEL CHAIR SIGNATURE: __________________________', 330, y);

  doc.end();
}

module.exports = {
  generateEvaluationPdf,
};
