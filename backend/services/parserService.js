const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { SKILLS_TAXONOMY } = require('../skillsTaxonomy');

// Node native fallback parsers
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

/**
 * Executes python extractor using pdfplumber/python-docx
 */
function runPythonExtractor(filePath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '..', 'parse_cv.py');
    execFile('python', [pythonScript, filePath], { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Node.js fallback extractor using mammoth (docx) and pdf-parse (pdf)
 */
async function runNodeExtractorFallback(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let rawText = '';
  
  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    rawText = pdfData.text || '';
  } else if (ext === '.docx' || ext === '.doc') {
    const result = await mammoth.extractRawText({ path: filePath });
    rawText = result.value || '';
  } else if (ext === '.txt') {
    rawText = fs.readFileSync(filePath, 'utf-8');
  }

  const emailMatch = rawText.match(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/);
  const email = emailMatch ? emailMatch[0] : '';

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  let candidateName = '';
  for (const line of lines.slice(0, 5)) {
    if (line.length < 35 && !/[@#{}[]:;=<>]/i.test(line) && !/resume|cv|curriculum/i.test(line)) {
      candidateName = line;
      break;
    }
  }

  return {
    success: true,
    raw_text: rawText,
    email,
    candidate_name: candidateName
  };
}

/**
 * Match raw text against predefined skills taxonomy
 */
function extractSkillsFromText(rawText) {
  if (!rawText) return [];

  const matchedSkills = new Set();
  const lowerText = rawText.toLowerCase();

  for (const skill of SKILLS_TAXONOMY) {
    for (const alias of skill.aliases) {
      // Escape special characters for regex like C++, C#, .NET
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Create word boundary or delimiter boundary pattern
      const regex = new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, 'i');
      if (regex.test(lowerText)) {
        matchedSkills.add(skill.name);
        break; // Matched this canonical skill, move to next
      }
    }
  }

  return Array.from(matchedSkills);
}

/**
 * Main CV parse workflow
 */
async function parseCvFile(filePath) {
  let extractedResult = null;

  try {
    // Primary: use python extractor with pdfplumber / python-docx
    console.log(`[Parser] Running python extractor for ${filePath}...`);
    extractedResult = await runPythonExtractor(filePath);
    if (!extractedResult || !extractedResult.success) {
      throw new Error(extractedResult?.error || 'Python extractor returned unsuccessful result');
    }
    console.log(`[Parser] Python extractor succeeded. Extracted ${extractedResult.raw_text?.length || 0} characters.`);
  } catch (pyErr) {
    console.warn(`[Parser] Python extractor failed/unavailable (${pyErr.message}). Switching to Node native fallback...`);
    try {
      extractedResult = await runNodeExtractorFallback(filePath);
      console.log(`[Parser] Node fallback succeeded. Extracted ${extractedResult.raw_text?.length || 0} characters.`);
    } catch (nodeErr) {
      console.error(`[Parser] Both extractors failed: ${nodeErr.message}`);
      // Never block the user flow
      extractedResult = {
        success: true,
        raw_text: '',
        candidate_name: 'Candidate',
        email: ''
      };
    }
  }

  const rawText = extractedResult.raw_text || '';
  const detectedSkills = extractSkillsFromText(rawText);

  return {
    candidateName: extractedResult.candidate_name || 'Candidate',
    email: extractedResult.email || '',
    detectedSkills: detectedSkills,
    textPreview: rawText.substring(0, 300)
  };
}

module.exports = {
  parseCvFile,
  extractSkillsFromText
};
